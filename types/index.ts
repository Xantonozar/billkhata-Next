export enum Role {
    Manager = 'Manager',
    MasterManager = 'MasterManager',
    Member = 'Member',
}

export enum RoomStatus {
    NoRoom = "NoRoom",
    Pending = "Pending",
    Approved = "Approved",
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    roomStatus: RoomStatus;
    khataId?: string;
    avatarUrl?: string;
    whatsapp?: string;
    facebook?: string;
    isVerified?: boolean;
    foodPreferences?: {
        likes: string[];
        dislikes: string[];
        avoidance: string[];
        notes: string;
    };
}

export type PaymentStatus = 'Unpaid' | 'Pending Approval' | 'Paid' | 'Overdue';

export interface BillShare {
    userId: string;
    userName: string;
    amount: number;
    status: PaymentStatus;
    paidFromMealFund?: boolean;
}

export interface Bill {
    id: string;
    khataId: string;
    title: string;
    totalAmount: number;
    dueDate: string;
    category: string;
    description?: string;
    imageUrl?: string;
    createdBy: string;
    shares: BillShare[];
    createdAt?: string;
    updatedAt?: string;
}


export interface JoinRequest {
    id: string;
    userName: string;
    userEmail: string;
    requestedAt: string;
}

export interface TodaysMenu {
    breakfast: string;
    lunch: string;
    dinner: string;
}

export interface Menu {
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
}

export interface MealHistory {
    _id: string;
    date: string;
    createdAt: string;
    breakfast: number;
    lunch: number;
    dinner: number;
    changedByUserId?: {
        name: string;
        role: string;
    };
    targetUserId?: {
        name: string;
    };
}

export interface CalculationPeriod {
    _id: string;
    khataId: string;
    name: string;
    startDate: string;
    endDate: string | null;
    status: 'Active' | 'Ended';
    startedBy: string;
    endedBy?: string;
    createdAt: string;
    updatedAt: string;
}
