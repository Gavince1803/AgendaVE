# Employee System Implementation Guide

## 🔧 Fixed Issues

The original employee system scripts had several schema mismatches that have been corrected:

### Schema Corrections Made:
1. **profiles.user_type** → **profiles.role** 
2. **providers.name** → **providers.business_name**
3. **availabilities.day_of_week** → **availabilities.weekday**
4. **services columns** → Updated to match actual schema (duration_minutes, price_amount, price_currency)
5. **appointments structure** → Simplified to match actual schema (appointment_date, appointment_time, notes)
6. **device_push_tokens.device_type** → **device_push_tokens.platform**

### RLS Policy Fixes:
- Updated employee policies to use `providers.user_id` instead of direct profile relationships
- Fixed all column references to match your actual database schema

## 🚀 Implementation Steps

### Step 1: Run the Migration
Execute the employee system migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of:
-- database/migrations/add_employees_system.sql
```

### Step 2: Test with Sample Data (Optional)
Create comprehensive test data to validate the system:

```sql
-- Copy and paste the contents of:
-- database/test_data_with_employees.sql
```

### Step 3: Verify Security (Optional)
Run security tests to ensure RLS policies work correctly:

```sql
-- Copy and paste the contents of:
-- database/employee_rls_security_test.sql
```

## 📊 What Gets Added

### New Tables:
1. **`employees`** - Stores staff members for each business
2. **`employee_availabilities`** - Custom schedules for employees

### Modified Tables:
1. **`appointments`** - Adds `employee_id` column
2. **`reviews`** - Adds `employee_id` column

### Key Features:
- **Auto-creation**: Business owners automatically become the first employee
- **Flexible scheduling**: Employees can inherit business hours or have custom schedules
- **Secure access**: Comprehensive RLS policies protect all data
- **Backward compatible**: Existing appointments without employees continue to work

## 🎯 Business Logic

### Employee Creation:
- When a provider creates their business, they're automatically added as an employee with `is_owner = true`
- Existing providers will have owner employees created via the migration script

### Schedule Inheritance:
- By default, employees follow their business's working hours
- Employees can enable custom schedules via `custom_schedule_enabled = true`
- The `get_employee_availability()` function automatically returns the correct schedule

### Booking Flow:
1. Client selects a business/provider
2. System loads the first available employee by default
3. Client can choose a different employee if desired
4. Appointment is created with the selected `employee_id`

## 🔐 Security Model

### Employee Access:
- **Providers**: Can manage all their business's employees
- **Clients**: Can view active employees (for booking)
- **Anonymous**: Can view active employees (for discovery)

### Employee Availability:
- **Providers**: Can manage employee custom schedules
- **Clients/Anonymous**: Can view schedules (read-only)

### Data Isolation:
- Providers cannot see/modify employees from other businesses
- Clients cannot modify employee data
- All access is properly controlled via RLS policies

## 🎨 Frontend Implementation Suggestions

### Employee Selection Component:
```typescript
interface Employee {
  id: string;
  name: string;
  position: string;
  bio?: string;
  custom_schedule_enabled: boolean;
  is_active: boolean;
}

// In your booking screen:
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
const [availableSlots, setAvailableSlots] = useState([]);

// Load first employee by default, allow switching
useEffect(() => {
  if (employees.length > 0 && !selectedEmployee) {
    setSelectedEmployee(employees[0]);
  }
}, [employees]);
```

### Availability Loading:
```typescript
// Use the get_employee_availability function
const loadEmployeeSchedule = async (employeeId: string, dayOfWeek: number) => {
  const { data } = await supabase.rpc('get_employee_availability', {
    employee_uuid: employeeId,
    check_day: dayOfWeek
  });
  return data;
};
```

## ✅ Testing Verification

After running the migration and test data, verify:

1. **Employee Creation**: Each test provider should have employees
2. **Custom Schedules**: Some employees should have different hours than their business
3. **Appointments**: Should be assigned to specific employees
4. **RLS Security**: Different user types should see appropriate data only

## 🔄 Rollback Plan

If needed, you can rollback by:
1. Removing the `employee_id` columns from `appointments` and `reviews`
2. Dropping the `employees` and `employee_availabilities` tables
3. The system will continue working as before

## 📝 Next Steps

1. **Run the migration** (required)
2. **Update your frontend** to support employee selection
3. **Test the booking flow** with different employees
4. **Add employee management** to provider dashboards

The system is now ready to support multi-employee businesses like barbershops, clinics, spas, and more!