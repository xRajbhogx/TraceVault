import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { colors } from "../../constants/colors";

const TabIcon = ({
	name,
	color,
}: {
	name: "home" | "lock-closed";
	color: string;
}) => {
	return <Ionicons name={name} size={20} color={color} />;
};

const TabsLayout = () => {
	const { isSignedIn, isLoaded } = useAuth();

	if (!isLoaded) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={colors.accent} />
			</View>
		);
	}

	if (!isSignedIn) {
		return <Redirect href="/(auth)/LoginScreen" />;
	}

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.accent,
				tabBarInactiveTintColor: colors.tabInactive,
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: styles.tabBarLabel,
				tabBarItemStyle: styles.tabBarItem,
			}}
		>
			<Tabs.Screen
				name="HomeScreen"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="ValutScreen"
				options={{
					title: "Vault",
					tabBarIcon: ({ color }) => (
						<TabIcon name="lock-closed" color={color} />
					),
				}}
			/>
		</Tabs>
	);
};

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.background,
	},
	tabBar: {
		backgroundColor: colors.surfaceMuted,
		borderTopColor: colors.border,
		height: 70,
		paddingTop: 8,
		paddingBottom: 12,
	},
	tabBarLabel: {
		fontSize: 12,
		fontWeight: "600",
	},
	tabBarItem: {
		gap: 4,
	},
});

export default TabsLayout;
