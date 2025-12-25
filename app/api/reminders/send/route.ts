import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireManager } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bill from '@/models/Bill';
import ShoppingDuty from '@/models/ShoppingDuty';
import { notifyUser, notifyUsers } from '@/lib/notificationService';

export const dynamic = 'force-dynamic';

type ReminderType = 'add_meal' | 'pay_bill' | 'approve_deposit' | 'approve_expense' | 'shopping';

const REMINDER_MESSAGES: Record<ReminderType, { title: string; message: string; link: string }> = {
    add_meal: {
        title: '🍽️ Meal Reminder',
        message: "Don't forget to add your meal entries for today!",
        link: '/meals'
    },
    pay_bill: {
        title: '💳 Bill Payment Reminder',
        message: 'You have pending bills to pay. Please review and pay them.',
        link: '/payment-dashboard'
    },
    approve_deposit: {
        title: '💰 Deposit Approval Needed',
        message: 'You have deposits waiting for your approval.',
        link: '/pending-approvals'
    },
    approve_expense: {
        title: '🧾 Expense Approval Needed',
        message: 'You have expenses waiting for your approval.',
        link: '/pending-approvals'
    },
    shopping: {
        title: '🛒 Shopping Reminder',
        message: "You're on shopping duty today! Don't forget to shop for the room.",
        link: '/shopping'
    }
};

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = await getSession(req);
        const managerCheck = requireManager(user);
        if (managerCheck) return managerCheck;

        const { khataId, type, targetUserIds, billId, message } = await req.json();

        if (!khataId || !type) {
            return NextResponse.json(
                { message: 'khataId and type are required' },
                { status: 400 }
            );
        }

        if (!REMINDER_MESSAGES[type as ReminderType]) {
            return NextResponse.json(
                { message: 'Invalid reminder type' },
                { status: 400 }
            );
        }

        // Verify manager belongs to this room
        if (user.khataId !== khataId) {
            return NextResponse.json(
                { message: 'You can only send reminders to your own room' },
                { status: 403 }
            );
        }

        const reminderConfig = REMINDER_MESSAGES[type as ReminderType];
        let recipients: string[] = [];

        switch (type) {
            case 'add_meal':
                // Send to all room members except manager
                const members = await User.find({
                    khataId,
                    roomStatus: 'Approved',
                    _id: { $ne: user._id }
                }).select('_id');
                recipients = members.map(m => m._id.toString());
                break;

            case 'pay_bill':
                if (billId) {
                    // Send to specific bill's unpaid members
                    const bill = await Bill.findById(billId);
                    if (bill) {
                        recipients = bill.shares
                            .filter((s: any) => s.status === 'Unpaid' || s.status === 'Overdue')
                            .map((s: any) => s.userId.toString());
                    }
                } else {
                    // Send to all members with any unpaid bills
                    const bills = await Bill.find({ khataId });
                    const unpaidUserIds = new Set<string>();
                    bills.forEach(bill => {
                        bill.shares.forEach((s: any) => {
                            if (s.status === 'Unpaid' || s.status === 'Overdue') {
                                unpaidUserIds.add(s.userId.toString());
                            }
                        });
                    });
                    recipients = Array.from(unpaidUserIds);
                }
                break;

            case 'approve_deposit':
            case 'approve_expense':
                // Send to the manager (self-reminder for pending approvals)
                recipients = [user._id.toString()];
                break;

            case 'shopping':
                // Send to today's shopper
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const duty = await ShoppingDuty.findOne({ khataId }).sort({ weekStart: -1 });
                if (duty) {
                    const todayEntry = duty.items.find((item: any) => item.day === today);
                    if (todayEntry?.userId) {
                        recipients = [todayEntry.userId.toString()];
                    }
                }
                break;
        }

        // Use custom targetUserIds if provided
        if (targetUserIds && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
            recipients = targetUserIds;
        }

        if (recipients.length === 0) {
            return NextResponse.json(
                { message: 'No recipients found for this reminder type', sent: 0 },
                { status: 200 }
            );
        }

        // Send notifications
        await notifyUsers(recipients, {
            khataId,
            title: reminderConfig.title,
            message: message || reminderConfig.message,
            type: 'reminder',
            link: reminderConfig.link
        });

        console.log(`📢 Reminder sent: ${type} to ${recipients.length} user(s)`);

        return NextResponse.json({
            message: 'Reminders sent successfully',
            sent: recipients.length,
            type
        });

    } catch (error: any) {
        console.error('❌ Send reminder error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
