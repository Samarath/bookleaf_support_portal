import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inbox, AlertCircle, CheckCircle, Clock, Menu, X, Zap, Save, User, Send, FileText, Filter } from "lucide-react";
import { api } from "../api/axios";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // High-level View Tabs
  const [viewMode, setViewMode] = useState<"action_required" | "resolved" | "all">("action_required");
  
  // Advanced Filters (Status removed, handled by viewMode)
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("urgent_oldest");

  // Local state for editing ticket details
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [adminReply, setAdminReply] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["adminTickets"],
    queryFn: async () => {
      const res = await api.get("/tickets");
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/admin");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_TICKET") {
        queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
      }
    };
    return () => ws.close();
  }, [queryClient]);

  // Sync ticket data to local state when opened
  useEffect(() => {
    if (selectedTicket) {
      setEditStatus(selectedTicket.status || "Open");
      setEditPriority(selectedTicket.ai_priority_score || "Medium");
      setEditCategory(selectedTicket.ai_category || "General Inquiry");
      setAdminReply(selectedTicket.admin_reply || selectedTicket.ai_draft_response || "");
      setInternalNote(selectedTicket.internal_notes || "");
    }
  }, [selectedTicket]);

  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      return api.put(`/tickets/${id}`, updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
      if (selectedTicket && selectedTicket._id === variables.id) {
        console.log(data)
        setSelectedTicket({ ...selectedTicket, ...variables.updates });
      }
    }
  });

  // Apply View Mode, Filtering, and Sorting
  const filteredTickets = tickets.filter((t: any) => {
    // 1. High-level Tab Filter
    const isResolved = t.status?.toLowerCase() === "resolved";
    if (viewMode === "action_required" && isResolved) return false;
    if (viewMode === "resolved" && !isResolved) return false;
    
    // 2. Granular Dropdown Filters
    if (filterCategory !== "all" && t.ai_category !== filterCategory) return false;
    if (filterPriority !== "all" && t.ai_priority_score?.toLowerCase() !== filterPriority) return false;
    
    return true;
  }).sort((a: any, b: any) => {
    if (sortBy === "urgent_oldest") {
      const priorityWeight: any = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
      const weightA = priorityWeight[a.ai_priority_score] || 0;
      const weightB = priorityWeight[b.ai_priority_score] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-700 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const hasUnsavedChanges = selectedTicket && (
    editStatus !== selectedTicket.status || 
    editPriority !== selectedTicket.ai_priority_score ||
    editCategory !== selectedTicket.ai_category ||
    internalNote !== (selectedTicket.internal_notes || "")
  );

  const CATEGORIES = [
    "Royalty & Payments", "ISBN & Metadata Issues", "Printing & Quality", 
    "Distribution & Availability", "Book Status & Production Updates", "General Inquiry"
  ];

  return (
    <div className="h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden flex flex-col relative">
      <header className="bg-[#1E293B] border-b border-gray-700 h-16 flex-shrink-0 px-4 md:px-6 flex items-center justify-between z-20 text-white">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1 text-gray-300 hover:text-white" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="w-6 h-6 bg-[#E95C6A] rounded-sm transform -rotate-12 hidden md:block"></div>
          <h1 className="text-xl font-bold tracking-tight">BookLeaf <span className="font-light text-gray-300">Operations</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="hidden md:inline text-gray-300">{user.name} (Admin)</span>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-[#E95C6A] hover:text-[#d64d5a]">Sign out</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

        {/* Sidebar Filters */}
        <nav className={`absolute md:relative z-30 h-full w-64 bg-white border-r border-gray-200 flex-shrink-0 p-5 space-y-6 transform transition-transform duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="flex justify-between items-center md:hidden mb-2">
            <span className="font-bold text-gray-900">Menu</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500"><X size={20} /></button>
          </div>

          {/* High-level Tabs */}
          <div className="space-y-2">
            <button
              onClick={() => { setViewMode("action_required"); setIsSidebarOpen(false); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${viewMode === "action_required" ? "bg-[#FFF5F6] text-[#E95C6A] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <AlertCircle size={20} /> Action Required
            </button>
            <button
              onClick={() => { setViewMode("resolved"); setIsSidebarOpen(false); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${viewMode === "resolved" ? "bg-[#FFF5F6] text-[#E95C6A] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <CheckCircle size={20} /> Resolved
            </button>
            <button
              onClick={() => { setViewMode("all"); setIsSidebarOpen(false); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${viewMode === "all" ? "bg-[#FFF5F6] text-[#E95C6A] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Inbox size={20} /> All Tickets
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Granular Filters */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Filter size={14}/> Advanced Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Priority</label>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white">
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Category</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white">
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sort Order</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white">
                  <option value="urgent_oldest">Urgent & Oldest First</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Queue */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {viewMode === 'action_required' ? 'Action Required' : viewMode === 'resolved' ? 'Resolved Tickets' : 'All Tickets'}
            </h2>
            <span className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm font-semibold text-gray-600 shadow-sm">
              {filteredTickets.length} Tickets
            </span>
          </div>
          
          {isLoading ? (
            <div className="text-center text-gray-500 py-10">Loading queue...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
              <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">No tickets found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filteredTickets.map((ticket: any) => (
                <div key={ticket._id} onClick={() => setSelectedTicket(ticket)} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-[#E95C6A] transition-all cursor-pointer flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getPriorityColor(ticket.ai_priority_score)}`}>{ticket.ai_priority_score}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 flex-1">{ticket.subject}</h3>
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-gray-500 font-medium truncate max-w-[150px]">Auth: {ticket.author_id}</span>
                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]">{ticket.ai_category}</span>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Ticket Details Drawer */}
      {selectedTicket && <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40" onClick={() => setSelectedTicket(null)} />}
      
      <div className={`fixed inset-y-0 right-0 w-full md:w-[650px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${selectedTicket ? "translate-x-0" : "translate-x-full"}`}>
        {selectedTicket && (
          <>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Ticket Workspace</h2>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
              
              {/* Header Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                  <button 
                    onClick={() => updateTicket.mutate({ id: selectedTicket._id, updates: { assigned_to: user.email }})}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <User size={14} /> {selectedTicket.assigned_to === user.email ? "Assigned to You" : "Assign to Me"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <div className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100"><span className="font-semibold text-gray-900">Author:</span> {selectedTicket.author_id}</div>
                  <div className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100"><span className="font-semibold text-gray-900">Book:</span> {selectedTicket.book_id}</div>
                  <div className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100"><span className="font-semibold text-gray-900">Created:</span> {new Date(selectedTicket.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Admin Overrides */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={16} /> Classifications & Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="text-sm font-medium rounded-md border-gray-300 p-2 bg-gray-50">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                    <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className={`text-sm font-semibold rounded-md border-gray-300 p-2 ${getPriorityColor(editPriority)}`}>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className={`text-sm font-semibold rounded-md border-gray-300 p-2 ${getStatusColor(editStatus)}`}>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Author Message */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Original Query</h4>
                <div className="bg-white rounded-xl p-5 text-gray-800 text-sm whitespace-pre-wrap border border-gray-200 shadow-sm">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Editable AI Draft & Response */}
              <div>
                <h4 className="text-sm font-bold text-[#E95C6A] flex items-center justify-between uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5"><Zap size={16} /> Draft Response to Author</span>
                  {selectedTicket.admin_reply && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">Reply Sent</span>}
                </h4>
                <div className="bg-[#FFF5F6] rounded-xl p-4 border border-[#fbd5d9] shadow-sm">
                  <p className="text-xs text-gray-500 mb-3">This draft was generated by AI based on BookLeaf policies. Edit it as needed before sending.</p>
                  <textarea 
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    rows={6}
                    className="w-full text-sm p-3 rounded-lg border border-[#fbd5d9] focus:ring-1 focus:ring-[#E95C6A] focus:outline-none resize-y mb-3 bg-white"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => updateTicket.mutate({ id: selectedTicket._id, updates: { admin_reply: adminReply }})}
                      disabled={!adminReply || updateTicket.isPending}
                      className="bg-[#E95C6A] text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-[#d64d5a] disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send size={16} /> {updateTicket.isPending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <FileText size={16} /> Internal Notes (Private)
                </h4>
                <textarea 
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add notes for other admins..."
                  rows={3}
                  className="w-full text-sm p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-y shadow-sm"
                />
              </div>
            </div>

            {/* Sticky Footer for Meta Saves */}
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
              <button
                onClick={() => updateTicket.mutate({ 
                  id: selectedTicket._id, 
                  updates: { status: editStatus, ai_priority_score: editPriority, ai_category: editCategory, internal_notes: internalNote } 
                })}
                disabled={!hasUnsavedChanges || updateTicket.isPending}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                <Save size={16} /> {updateTicket.isPending ? "Saving..." : "Save Settings & Notes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}