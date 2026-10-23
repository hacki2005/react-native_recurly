import { useSyncExternalStore } from "react";

import { icons } from "./icons";

const getRenewalDate = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString();
};

const getDaysLeft = (renewalDate: string) =>
    Math.ceil((Date.parse(renewalDate) - Date.now()) / (24 * 60 * 60 * 1000));

export const tabs: AppTab[] = [
    { name: "index", title: "Home", icon: icons.home },
    { name: "subscriptions", title: "Subscriptions", icon: icons.wallet },
    { name: "insights", title: "Insights", icon: icons.activity },
    { name: "settings", title: "Settings", icon: icons.setting },
];

export const HOME_USER = {
    name: "Sri hari",
};

export const HOME_BALANCE = {
    amount: 1000,
    nextRenewalDate: getRenewalDate(2),
};

const upcomingSubscriptionFixtures = [
    {
        id: "spotify",
        icon: icons.spotify,
        name: "Spotify",
        price: 5.99,
        currency: "USD",
        renewalDate: getRenewalDate(2),
    },
    {
        id: "notion",
        icon: icons.notion,
        name: "Notion",
        price: 12.0,
        currency: "USD",
        renewalDate: getRenewalDate(4),
    },
    {
        id: "figma",
        icon: icons.figma,
        name: "Figma",
        price: 15.0,
        currency: "USD",
        renewalDate: getRenewalDate(6),
    },
];

export const UPCOMING_SUBSCRIPTIONS: UpcomingSubscription[] =
    upcomingSubscriptionFixtures
        .filter(({ renewalDate }) => Date.parse(renewalDate) > Date.now())
        .map(({ renewalDate, ...subscription }) => ({
            ...subscription,
            renewalDate,
            daysLeft: getDaysLeft(renewalDate),
        }));

export const HOME_SUBSCRIPTIONS: Subscription[] = [
    {
        id: "adobe-creative-cloud",
        icon: icons.adobe,
        name: "Adobe Creative Cloud",
        plan: "Teams Plan",
        category: "Design",
        paymentMethod: "Visa ending in 8530",
        status: "active",
        startDate: "2025-03-20T10:00:00.000Z",
        price: 77.49,
        currency: "USD",
        billing: "Monthly",
        renewalDate: getRenewalDate(7),
        color: "#f5c542",
    },
    {
        id: "github-pro",
        icon: icons.github,
        name: "GitHub Pro",
        plan: "Developer",
        category: "Developer Tools",
        paymentMethod: "Mastercard ending in 2408",
        status: "active",
        startDate: "2024-11-24T10:00:00.000Z",
        price: 9.99,
        currency: "USD",
        billing: "Monthly",
        renewalDate: getRenewalDate(12),
        color: "#e8def8",
    },
    {
        id: "claude-pro",
        icon: icons.claude,
        name: "Claude Pro",
        plan: "Pro Plan",
        category: "AI Tools",
        paymentMethod: "Amex ending in 1010",
        status: "paused",
        startDate: "2025-06-27T10:00:00.000Z",
        price: 20.0,
        currency: "USD",
        billing: "Monthly",
        renewalDate: getRenewalDate(18),
        color: "#b8d4e3",
    },
    {
        id: "canva-pro",
        icon: icons.canva,
        name: "Canva Pro",
        plan: "Yearly Access",
        category: "Design",
        paymentMethod: "Visa ending in 7784",
        status: "cancelled",
        startDate: "2024-04-02T10:00:00.000Z",
        price: 119.99,
        currency: "USD",
        billing: "Yearly",
        renewalDate: getRenewalDate(25),
        color: "#b8e8d0",
    },
];

let subscriptions = HOME_SUBSCRIPTIONS;
const subscriptionListeners = new Set<() => void>();

const subscribeToSubscriptions = (listener: () => void) => {
    subscriptionListeners.add(listener);
    return () => subscriptionListeners.delete(listener);
};

const getSubscriptions = () => subscriptions;

export const addSubscription = (subscription: Subscription) => {
    subscriptions = [subscription, ...subscriptions];
    subscriptionListeners.forEach((listener) => listener());
};

export const useSubscriptions = () =>
    useSyncExternalStore(subscribeToSubscriptions, getSubscriptions, getSubscriptions);