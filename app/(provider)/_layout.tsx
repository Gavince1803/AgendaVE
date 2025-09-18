import { Stack } from 'expo-router';

export default function ProviderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="my-business" />
      <Stack.Screen name="availability" />
    </Stack>
  );
}
