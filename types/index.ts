export enum Role {
    Manager = 'Manager',
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
}

export type PaymentStatus = 'Unpaid' | 'Pending Approval' | 'Paid' | 'Overdue';

export interface BillShare {
    userId: string;
    userName: string;
    amount: number;
    status: PaymentStatus;
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
