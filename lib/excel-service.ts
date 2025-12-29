import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { read, utils } from 'xlsx';

export interface ImportedBooking {
    date: string;       // YYYY-MM-DD
    time: string;       // HH:mm (24h)
    clientName: string;
    clientPhone: string;
    serviceName: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    notes?: string;
    isValid: boolean;
    errors: string[];
    importStatus?: 'pending' | 'success' | 'error';
    importError?: string;
}

export class ExcelService {
    static async pickAndParseExcel(): Promise<ImportedBooking[]> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                    'application/vnd.ms-excel', // .xls
                    'text/csv' // .csv
                ],
                copyToCacheDirectory: true
            });

            if (result.canceled) {
                return [];
            }

            const asset = result.assets[0];
            if (!asset) return [];

            let data: any[] = [];

            if (Platform.OS === 'web') {
                // WEB: Fetch the blob from the URI (blob:...)
                const response = await fetch(asset.uri);
                const blob = await response.blob();

                // Read as ArrayBuffer
                const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as ArrayBuffer);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(blob);
                });

                const workbook = read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                data = utils.sheet_to_json(sheet);
            } else {
                // NATIVE: Use FileSystem
                const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
                    encoding: 'base64'
                });
                const workbook = read(fileContent, { type: 'base64' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                data = utils.sheet_to_json(sheet);
            }

            return this.normalizeData(data);
        } catch (error) {
            console.error('[ExcelService] Error parsing file:', error);
            throw new Error('No se pudo leer el archivo Excel.');
        }
    }

    private static normalizeData(rows: any[]): ImportedBooking[] {
        return rows.map(row => {
            // Normalize keys to lowercase for flexible matching
            const normalizedRow: Record<string, any> = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase().trim()] = row[key];
            });

            const errors: string[] = [];

            // 1. Parse Date
            // Aliases: fecha, date, dia, day, start date
            const dateRaw = normalizedRow['fecha'] || normalizedRow['date'] || normalizedRow['dia'] || normalizedRow['day'] || normalizedRow['start date'];
            let date = '';
            if (!dateRaw) {
                errors.push('Falta la fecha');
            } else {
                date = this.parseDate(dateRaw);
                if (!date) errors.push('Formato de fecha inválido');
            }

            // 2. Parse Time
            // Aliases: hora, time, hour, inicio, start time
            const timeRaw = normalizedRow['hora'] || normalizedRow['time'] || normalizedRow['hour'] || normalizedRow['inicio'] || normalizedRow['start time'];
            let time = '';
            if (!timeRaw) {
                errors.push('Falta la hora');
            } else {
                time = this.parseTime(timeRaw);
                if (!time) errors.push('Formato de hora inválido');
            }

            // 3. Client
            // Aliases: cliente, client, nombre, name, full name, paciente
            const clientName = normalizedRow['cliente'] || normalizedRow['client'] || normalizedRow['nombre'] || normalizedRow['name'] || normalizedRow['full name'] || normalizedRow['paciente'] || 'Anónimo';

            // 4. Phone
            // Aliases: telefono, teléfono, phone, celular, mobile, movil, móvil, whatsapp
            const clientPhone = normalizedRow['telefono'] || normalizedRow['teléfono'] || normalizedRow['phone'] || normalizedRow['celular'] || normalizedRow['mobile'] || normalizedRow['movil'] || normalizedRow['móvil'] || normalizedRow['whatsapp'] || '';

            // 5. Service
            // Aliases: servicio, service, tratamiento, treatment, tipo
            const serviceName = normalizedRow['servicio'] || normalizedRow['service'] || normalizedRow['tratamiento'] || normalizedRow['treatment'] || normalizedRow['tipo'] || 'Servicio General';

            // 6. Status
            // Aliases: estado, status, e
            const statusRaw = normalizedRow['estado'] || normalizedRow['status'] || 'Confirmada';
            let status: 'confirmed' | 'pending' | 'cancelled' = 'confirmed';
            const sLower = String(statusRaw).toLowerCase();
            if (sLower.includes('pendiente') || sLower.includes('pending')) status = 'pending';
            else if (sLower.includes('cancel')) status = 'cancelled';

            return {
                date,
                time,
                clientName: String(clientName).trim(),
                clientPhone: String(clientPhone).trim(),
                serviceName: String(serviceName).trim(),
                status,
                notes: normalizedRow['notas'] || normalizedRow['notes'] || normalizedRow['comentarios'] || '',
                isValid: errors.length === 0,
                errors
            };
        });
    }

    private static parseDate(raw: any): string {
        try {
            // Check if Excel Serial Date (number)
            if (typeof raw === 'number') {
                const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
                return date.toISOString().split('T')[0];
            }
            const str = String(raw).trim();
            // YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
            // DD/MM/YYYY or DD-MM-YYYY
            const parts = str.split(/[-/]/);
            if (parts.length === 3) {
                // Check if first part is Year (YYYY-MM-DD or YYYY/MM/DD)
                if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                // Assume DD-MM-YYYY
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    private static parseTime(raw: any): string {
        try {
            // Excel Decimal Time
            if (typeof raw === 'number') {
                const totalSeconds = Math.round(raw * 86400);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }

            let str = String(raw).trim().toLowerCase();

            // "9:30 am", "09:30 PM"
            const amPmMatch = str.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)/i);
            if (amPmMatch) {
                let h = parseInt(amPmMatch[1], 10);
                const m = parseInt(amPmMatch[2], 10);
                const ap = amPmMatch[3].toLowerCase();

                if (ap === 'pm' && h < 12) h += 12;
                if (ap === 'am' && h === 12) h = 0;

                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }

            // Normal HH:MM
            if (/^\d{1,2}:\d{2}/.test(str)) {
                // Ensure padding 9:30 -> 09:30
                const parts = str.split(':');
                return `${parts[0].padStart(2, '0')}:${parts[1].substring(0, 2)}`;
            }

            return '';
        } catch (e) {
            return '';
        }
    }

    // Helper to generate a template logic could go here too
}
