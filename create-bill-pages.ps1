# Script to generate category bill pages
$categories = @(    
    @{name='Electricity'; icon='ElectricityIcon'; color='yellow-500'; emoji='⚡'},
    @{name='Water'; icon='WaterIcon'; color='blue-500'; emoji='💧'},
    @{name='Gas'; icon='GasIcon'; color='orange-500'; emoji='🔥'},
    @{name='Wi-Fi'; icon='WifiIcon'; color='cyan-500'; emoji='📶'},
    @{name='Maid'; icon='MaidIcon'; color='purple-500'; emoji='🧹'},
    @{name='Others'; icon='OtherIcon'; color='slate-500'; emoji='📋'}
)

$template = @'
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Bill } from '@/types';
import { Role } from '@/types';
import { {ICON_NAME}, ArrowLeftIcon, PlusIcon } from '@/components/Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import AddBillModal from '@/components/modals/AddBillModal';
import EditSharedBillModal from '@/components/modals/EditSharedBillModal';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { useRouter } from 'next/navigation';

const CATEGORY = '{CATEGORY_NAME}';
const ICON = <{ICON_NAME} className="w-8 h-8 text-{COLOR}" />;

// Rest of code is identical to Rent page...
'@

Write-Host "Category bill page generator created"
