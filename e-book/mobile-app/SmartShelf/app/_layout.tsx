import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityIndicator, View, StatusBar, LogBox } from 'react-native';
import MilestoneStatusBar from '@/components/ui/MilestoneStatusBar';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/hooks/use-theme';
import { StripeProvider } from '@stripe/stripe-react-native';
import { getStripeConfig } from '@/components/services/subscriptionServices';


function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const { colors } = useTheme();
    const colorScheme = useColorScheme();

    useEffect(() => {
        if (isLoading) return;

        // Determine if the user is currently on an authentication screen
        // This allows access to Login and Register without being logged in
        const isAuthScreen = segments.some(segment => segment === 'Login' || segment === 'Register');

        if (!user && !isAuthScreen) {
            // If not logged in and not on an auth screen, redirect to Login
            router.replace('/Login');
        } else if (user && isAuthScreen) {
            // If logged in and on an auth screen, redirect to the Home (index)
            router.replace('/');
        }
    }, [user, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1 }}>
                <MilestoneStatusBar />
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="Login" options={{ headerShown: false }} />
                    <Stack.Screen name="Register" options={{ headerShown: false }} />
                    <Stack.Screen name="BookListing" options={{ headerShown: false }} />
                    <Stack.Screen name="BookDetails" options={{ headerShown: false }} />
                    <Stack.Screen name="Reader" options={{ headerShown: false }} />
                    <Stack.Screen name="ReadingMilestones" options={{ title: 'Reading Milestones', headerShown: false }} />
                    <Stack.Screen name="Notifications" options={{ title: 'Notifications', headerShown: false }} />
                </Stack>
            </View>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    const [stripePublishableKey, setStripePublishableKey] = useState("");
    const [isStripeLoading, setIsStripeLoading] = useState(true);

    useEffect(() => {
        const loadStripeConfig = async () => {
            try {
                const res = await getStripeConfig();
                if (res.success && res.data?.publishableKey) {
                    setStripePublishableKey(res.data.publishableKey);
                } else {
                    console.warn('Stripe config load failed:', res.message);
                }
            } catch (error) {
                console.warn('Stripe config bootstrap failed:', error);
            } finally {
                setIsStripeLoading(false);
            }
        };

        loadStripeConfig();
    }, []);

    if (isStripeLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <ActivityIndicator size="large" color="#4F7942" />
            </View>
        );
    }

    if (!stripePublishableKey) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 24 }}>
                <ActivityIndicator size="large" color="#4F7942" />
            </View>
        );
    }

    return (
        <StripeProvider publishableKey={stripePublishableKey} urlScheme="smartshelf">
            <AuthProvider>
                <AppThemeProvider>
                    <RootLayoutNav />
                </AppThemeProvider>
            </AuthProvider>
        </StripeProvider>
    );
}
