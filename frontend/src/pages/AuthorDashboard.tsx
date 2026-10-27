import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { BookOpen, Ticket, MessageSquarePlus, CheckCircle, Paperclip, Menu, X } from "lucide-react";
import { api } from "../api/axios";

type SupportForm = {
  book_id: string;
  subject: string;
  description: string;
};

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState<"books" | "tickets" | "new">("books");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupportForm>();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["authorTickets", user.author_id],
    queryFn: async () => {
      const res = await api.get(`/tickets/author/${user.author_id}`);
      return res.data;
    },
    refetchInterval: 5000, 
  });

  const submitTicket = useMutation({
    mutationFn: async (data: SupportForm) => {
      const payload = {
        author_id: user.author_id,
        book_id: data.book_id,
        subject: data.subject,
        description: data.description,
      };
      return api.post("/tickets", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorTickets", user.author_id] });
      reset();
      setActiveTab("tickets");
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-700 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleTabChange = (tab: "books" | "tickets" | "new") => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden flex flex-col">
      {/* Fixed Top Navigation */}
      <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-1 text-gray-600 hover:text-gray-900"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="w-6 h-6 bg-[#E95C6A] rounded-sm transform -rotate-12 hidden md:block"></div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">BookLeaf <span className="font-light">Author</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-gray-500 hidden md:inline">Welcome, {user.name}</span>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="text-[#E95C6A] hover:text-[#d64d5a] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`
          absolute md:relative z-30 h-full w-64 bg-white border-r border-gray-200 flex-shrink-0 p-4 space-y-2
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          <div className="flex justify-between items-center md:hidden mb-6 px-2">
            <span className="font-bold text-gray-900">Menu</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500">
              <X size={20} />
            </button>
          </div>

          <button
            onClick={() => handleTabChange("books")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "books" ? "bg-[#FFF5F6] text-[#E95C6A] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <BookOpen size={20} />
            My Books
          </button>
          <button
            onClick={() => handleTabChange("tickets")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "tickets" ? "bg-[#FFF5F6] text-[#E95C6A] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Ticket size={20} />
            My Tickets
          </button>
          <button
            onClick={() => handleTabChange("new")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "new" ? "bg-[#FFF5F6] text-[#E95C6A] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <MessageSquarePlus size={20} />
            Submit Query
          </button>
        </nav>

        {/* Independently Scrolling Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            
         {activeTab === "books" && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Published Titles</h2>
    {user.books?.map((book: any) => (
      <div key={book.book_id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{book.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              ISBN: {book.isbn} • {book.genre}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">Publication Date:</span> {new Date(book.publication_date).toLocaleDateString()} • 
              <span className="font-medium text-gray-700 ml-2">MRP:</span> ₹{book.mrp}
            </p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200 self-start">
            {book.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Copies Sold</p>
            <p className="text-lg font-semibold text-gray-900">{book.total_copies_sold}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Royalty Earned</p>
            <p className="text-lg font-semibold text-green-600">₹{book.total_royalty_earned}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Royalty Paid</p>
            <p className="text-lg font-semibold text-gray-900">₹{book.royalty_paid}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Royalty Pending</p>
            <p className="text-lg font-semibold text-[#E95C6A]">₹{book.royalty_pending}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

            {activeTab === "tickets" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Support History</h2>
                {ticketsLoading ? (
                  <div className="text-gray-500">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                    <p className="text-gray-500">You haven't submitted any support queries yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket: any) => (
                      <div key={ticket._id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <h3 className="font-bold text-lg text-gray-900">{ticket.subject}</h3>
                          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Regarding: {ticket.book_id}</p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-800 text-sm">{ticket.description}</p>
                        </div>
                        {(ticket.admin_reply || ticket.ai_draft_response) && (
  <div className="bg-[#FFF5F6] border border-[#fbd5d9] rounded-lg p-4">
    <p className="text-xs font-bold text-[#E95C6A] uppercase tracking-wider mb-2 flex items-center gap-1">
      <CheckCircle size={14} /> Support Response
    </p>
    <p className="text-gray-800 text-sm whitespace-pre-wrap">
      {ticket.admin_reply || ticket.ai_draft_response}
    </p>
  </div>
)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "new" && (
              <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">How can we help?</h2>
                <form onSubmit={handleSubmit((data) => submitTicket.mutate(data))} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Which book is this regarding?</label>
                    <select 
                      {...register("book_id")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E95C6A] bg-white"
                    >
                      <option value="General / Account Level">General / Account Level</option>
                      {user.books?.map((b: any) => (
                        <option key={b.book_id} value={b.book_id}>{b.title} ({b.book_id})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <input 
                      type="text"
                      {...register("subject", { required: "Subject is required" })}
                      placeholder="Brief summary of your issue"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E95C6A]"
                    />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description</label>
                    <textarea 
                      {...register("description", { required: "Please provide details" })}
                      rows={5}
                      placeholder="Explain the issue you're facing..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E95C6A] resize-none"
                    ></textarea>
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-[#E95C6A] transition-colors cursor-pointer">
                      <Paperclip size={24} className="mb-2" />
                      <p className="text-sm">Click to upload or drag and drop</p>
                      <p className="text-xs mt-1 text-center">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitTicket.isPending}
                    className="w-full bg-[#E95C6A] text-white font-bold py-3 rounded-lg hover:bg-[#d64d5a] transition-all disabled:opacity-70 shadow-md hover:shadow-lg"
                  >
                    {submitTicket.isPending ? "Submitting..." : "Submit Query"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}