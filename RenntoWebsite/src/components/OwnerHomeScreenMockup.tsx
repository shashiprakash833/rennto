"use client";

import React from "react";
import { 
  MapPin, Bell, LayoutGrid, Users, Home, Pencil, Layers, Plus, 
  Wrench, CreditCard, User 
} from "lucide-react";

export default function OwnerHomeScreenMockup() {
  return (
    <div className="w-full h-full flex flex-col bg-[#f8fafc] text-slate-800 font-sans select-none overflow-hidden relative">
      
      {/* 1. Header Section */}
      <div className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white px-3 pb-5 pt-3 rounded-b-[2.2rem] shadow-md shrink-0 relative">
        {/* Subtle background circles for depth */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-lg" />
        <div className="absolute top-8 right-24 w-16 h-16 bg-white/5 rounded-full blur-md" />

        {/* Top Location and Notification Row */}
        <div className="flex justify-between items-center gap-2">
          {/* Location Badge */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 max-w-[80%]">
            <MapPin className="w-3 h-3 text-[#cbd5e1] shrink-0" />
            <span className="text-[8px] font-semibold tracking-wide truncate">
              Balaji Empire, Hyderabad, Telan...
            </span>
          </div>

          {/* Notification Bell */}
          <div className="w-7 h-7 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center relative border border-white/15 cursor-pointer active:scale-95 transition-all">
            <Bell className="w-3.5 h-3.5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Greeting and Building Icon Row */}
        <div className="flex justify-between items-end mt-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1 leading-none">
              Welcome Back, Vasavi <span className="animate-bounce">👋</span>
            </h2>
            
            {/* PG Room Count Status */}
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-[8px] font-bold tracking-wide">
                Anila delux pg (12 Rooms)
              </span>
            </div>
          </div>

          {/* Building glassmorphic badge */}
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shrink-0">
            <svg className="w-5 h-5 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="8" y2="6.01" />
              <line x1="12" y1="6" x2="12" y2="6.01" />
              <line x1="16" y1="6" x2="16" y2="6.01" />
              <line x1="8" y1="10" x2="8" y2="10.01" />
              <line x1="12" y1="10" x2="12" y2="10.01" />
              <line x1="16" y1="10" x2="16" y2="10.01" />
              <line x1="8" y1="14" x2="8" y2="14.01" />
              <line x1="12" y1="14" x2="12" y2="14.01" />
              <line x1="16" y1="14" x2="16" y2="14.01" />
              <line x1="8" y1="18" x2="8" y2="18.01" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
              <line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Stats Section */}
      <div className="grid grid-cols-3 gap-2 px-3 mt-3.5 shrink-0">
        {/* Total Beds */}
        <div className="bg-white p-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center text-center">
          <div className="w-6 h-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-1 shrink-0">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-800 leading-none">12</span>
          <span className="text-[7.5px] text-slate-400 font-bold tracking-tight mt-0.5 leading-none">Total Beds</span>
        </div>

        {/* Beds Occupied */}
        <div className="bg-white p-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center text-center">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-800 leading-none">0</span>
          <span className="text-[7.5px] text-slate-400 font-bold tracking-tight mt-0.5 leading-none">Beds Occupied</span>
        </div>

        {/* Beds Vacant */}
        <div className="bg-white p-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center text-center">
          <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-1 shrink-0">
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-800 leading-none">12</span>
          <span className="text-[7.5px] text-slate-400 font-bold tracking-tight mt-0.5 leading-none">Beds Vacant</span>
        </div>
      </div>

      {/* 3. Building Overview Header */}
      <div className="px-3 mt-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[11.5px] font-black text-slate-800 tracking-tight">
            Building Overview
          </h3>
          <Pencil className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer" />
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-full text-[8.5px] font-bold">
          <span className="bg-[#6d28d9] text-white px-2.5 py-0.5 rounded-full cursor-pointer shadow-sm">
            Floor View
          </span>
          <span className="text-slate-500 px-2.5 py-0.5 rounded-full cursor-pointer hover:text-slate-700">
            List View
          </span>
        </div>
      </div>

      {/* 4. Floor Selector & Rooms Grid Layout */}
      <div className="flex-grow flex gap-2 px-3 mt-3 overflow-hidden">
        {/* Left: Floor Selector (Vertical) */}
        <div className="flex flex-col items-center gap-2 bg-white px-1.5 py-3 rounded-full border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] shrink-0 self-start">
          <div className="w-7 h-7 rounded-full bg-[#6d28d9] text-white flex items-center justify-center font-black text-[9.5px] shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all">
            F1
          </div>
          <div className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center font-bold text-[9.5px] cursor-pointer transition-all">
            F2
          </div>
        </div>

        {/* Right: Rooms Grid Card Container */}
        <div className="flex-grow bg-white rounded-[1.8rem] border border-slate-100 p-3 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
          {/* Card Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 shrink-0">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#6d28d9]" />
              <span className="text-[10px] font-extrabold text-slate-800">Floor 1</span>
            </div>
            <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">
              6 Rooms
            </span>
          </div>

          {/* Rooms Grid */}
          <div className="flex-grow grid grid-cols-2 gap-2 mt-2.5 overflow-y-auto no-scrollbar pb-2">
            {[101, 102, 103, 104, 105, 106].map((roomNum) => (
              <div 
                key={roomNum}
                className="border border-slate-100 bg-[#f8fafc]/50 p-2 rounded-2xl flex flex-col justify-between relative hover:border-[#8b5cf6]/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-none shrink-0">
                      {roomNum}
                    </span>
                    <span className="bg-rose-50 text-rose-500 border border-rose-100 text-[6px] px-1 py-0.5 rounded font-black tracking-wide uppercase self-start sm:self-auto scale-90 origin-left shrink-0">
                      Vacant
                    </span>
                  </div>
                  <p className="text-[7.5px] text-slate-400 font-bold leading-none mt-1">
                    0/1 Beds
                  </p>
                </div>
                
                <button className="w-4.5 h-4.5 rounded-full bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#6d28d9] flex items-center justify-center self-end mt-2 active:scale-90 transition-all border border-[#e9d5ff]/30">
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Bottom Navigation Bar */}
      <div className="bg-white border-t border-slate-100 px-3 py-2 flex justify-between items-center shrink-0 shadow-lg">
        {/* Dashboard */}
        <div className="flex flex-col items-center gap-0.5 text-[#6d28d9] cursor-pointer">
          <Home className="w-4 h-4 fill-[#6d28d9]/10" />
          <span className="text-[7.5px] font-black tracking-wide">Dashboard</span>
        </div>

        {/* Issues */}
        <div className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <Wrench className="w-4 h-4" />
          <span className="text-[7.5px] font-bold tracking-wide">Issues</span>
        </div>

        {/* Payments */}
        <div className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <CreditCard className="w-4 h-4" />
          <span className="text-[7.5px] font-bold tracking-wide">Payments</span>
        </div>

        {/* Account */}
        <div className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <User className="w-4 h-4" />
          <span className="text-[7.5px] font-bold tracking-wide">Account</span>
        </div>
      </div>
      
    </div>
  );
}
