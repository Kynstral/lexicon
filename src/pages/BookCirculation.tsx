/* eslint-disable react-hooks/exhaustive-deps */
// noinspection ExceptionCaughtLocallyJS

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Book as BookIcon,
  Calendar,
  Check,
  CheckCircle,
  Loader2,
  RefreshCcw,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MemberDetail from "@/components/MemberDetail";
import { searchBooks } from "@/lib/data-service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const BookCirculation = () => {
  const { toast } = useToast();

  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookSearchResults, setBookSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [bookSearchOpen, setBookSearchOpen] = useState(false);
  const [isLoadingCategoryBooks, setIsLoadingCategoryBooks] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const BOOKS_PER_PAGE = 10;
  const [selectedCheckouts, setSelectedCheckouts] = useState([]);
  const [isProcessingBulkReturn, setIsProcessingBulkReturn] = useState(false);

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  const [dueDate, setDueDate] = useState("");
  const [dueDateOption, setDueDateOption] = useState("15days");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const [checkInMemberQuery, setCheckInMemberQuery] = useState("");
  const [memberCheckouts, setMemberCheckouts] = useState([]);
  const [selectedCheckInMember, setSelectedCheckInMember] = useState(null);
  const [checkInMemberOpen, setCheckInMemberOpen] = useState(false);
  const [isLoadingCheckouts, setIsLoadingCheckouts] = useState(false);
  const [checkInMemberResults, setCheckInMemberResults] = useState([]);
  const [returningBookIds, setReturningBookIds] = useState({});

  const [dueSoonBooks, setDueSoonBooks] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [isLoadingDueBooks, setIsLoadingDueBooks] = useState(false);

  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);

  const getDueDateFromOption = (option) => {
    const today = new Date();

    switch (option) {
      case "15days": {
        const fifteenDays = new Date(today);
        fifteenDays.setDate(today.getDate() + 15);
        return fifteenDays.toISOString().split("T")[0];
      }
      case "20days": {
        const twentyDays = new Date(today);
        twentyDays.setDate(today.getDate() + 20);
        return twentyDays.toISOString().split("T")[0];
      }
      case "30days": {
        const thirtyDays = new Date(today);
        thirtyDays.setDate(today.getDate() + 30);
        return thirtyDays.toISOString().split("T")[0];
      }
      case "custom":
        return dueDate;
      default:
        return "";
    }
  };

  useEffect(() => {
    if (dueDateOption !== "custom") {
      setDueDate(getDueDateFromOption(dueDateOption));
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
    }
  }, [dueDateOption]);

  const handleTabChange = (value) => {
    if (value === "due-dates") {
      loadDueBooksData();
    } else if (value === "members") {
      loadMembers();
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        const { data, error } = await supabase
          .from("books")
          .select("category")
          .eq("user_id", userId);

        if (error) throw error;

        const uniqueCategories = [
          ...new Set(data.map((book) => book.category)),
        ].filter(Boolean);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadBooksByCategory = async () => {
      if (selectedCategory === "all") {
        setBookSearchResults([]);
        setPage(1);
        setHasMore(false);
        return;
      }

      setIsLoadingCategoryBooks(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        const from = (page - 1) * BOOKS_PER_PAGE;
        const to = from + BOOKS_PER_PAGE - 1;

        const { data, error, count } = await supabase
          .from("books")
          .select("*", { count: "exact" })
          .eq("category", selectedCategory)
          .eq("user_id", userId)
          .gt("stock", 0)
          .order("title")
          .range(from, to);

        if (error) throw error;

        const formattedBooks = data.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publisher: book.publisher,
          publicationYear: book.publication_year,
          description: book.description,
          pageCount: book.page_count,
          category: book.category,
          coverImage: book.cover_image,
          language: book.language,
          price: book.price,
          stock: book.stock,
          status: book.status,
          rating: book.rating,
          tags: book.tags,
          location: book.location,
          created_at: book.created_at,
          updated_at: book.updated_at,
          user_id: book.user_id,
        }));

        if (page === 1) {
          setBookSearchResults(formattedBooks || []);
        } else {
          setBookSearchResults((prev) => [...prev, ...formattedBooks]);
        }

        setHasMore(count > to + 1);
      } catch (error) {
        console.error("Error loading books by category:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load books for this category.",
        });
        if (page === 1) {
          setBookSearchResults([]);
        }
      } finally {
        setIsLoadingCategoryBooks(false);
      }
    };

    loadBooksByCategory();
  }, [selectedCategory, page]);

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleBookSearch = async (query) => {
    if (!query || query.trim() === "") {
      if (selectedCategory !== "all") {
        return;
      }
      setBookSearchResults([]);
      return;
    }

    setIsSearchingBooks(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const books = await searchBooks(query, userId);

      const filtered =
        selectedCategory !== "all"
          ? books.filter(
              (book) => book.category === selectedCategory && book.stock > 0,
            )
          : books.filter((book) => book.stock > 0);

      setBookSearchResults(filtered || []);
    } catch (error) {
      console.error("Error searching books:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search books. Please try again.",
      });
      setBookSearchResults([]);
    } finally {
      setIsSearchingBooks(false);
    }
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setBookSearchOpen(false);
    setBookSearchQuery(book.title || "");
  };

  const handleMemberSearch = async (query) => {
    if (!query || query.trim() === "") {
      setMemberSearchResults([]);
      return;
    }

    setIsSearchingMembers(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .or(
          `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
        )
        .order("name");

      if (error) throw error;

      setMemberSearchResults(data || []);
    } catch (error) {
      console.error("Error searching members:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search members. Please try again.",
      });
      setMemberSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setMemberSearchOpen(false);
    setMemberSearchQuery(member.name || "");
  };

  const checkIfAlreadyBorrowed = async (bookId, memberId) => {
    try {
      const { data, error } = await supabase
        .from("borrowings")
        .select("*")
        .eq("book_id", bookId)
        .eq("member_id", memberId)
        .eq("status", "Borrowed")
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Error checking existing borrowing:", error);
      return false;
    }
  };

  const handleCheckout = async () => {
    if (!selectedBook || !selectedMember || !dueDate) {
      toast({
        title: "Missing Information",
        description:
          "Please select a book, member, and due date before checking out.",
        variant: "destructive",
      });
      return;
    }

    const alreadyBorrowed = await checkIfAlreadyBorrowed(
      selectedBook.id,
      selectedMember.id,
    );
    if (alreadyBorrowed) {
      toast({
        title: "Already Borrowed",
        description: `${selectedMember.name} has already borrowed this book.`,
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { error: bookError } = await supabase
        .from("books")
        .update({
          stock: selectedBook.stock - 1,
          status: selectedBook.stock - 1 > 0 ? "Available" : "Checked Out",
          reminder_sent: false,
          reminder_date: null,
        })
        .eq("id", selectedBook.id);

      if (bookError) throw bookError;

      const { error: borrowError } = await supabase.from("borrowings").insert({
        book_id: selectedBook.id,
        member_id: selectedMember.id,
        checkout_date: new Date().toISOString(),
        due_date: new Date(dueDate).toISOString(),
        status: "Borrowed",
        user_id: userId,
        reminder_sent: false,
        reminder_date: null,
      });

      if (borrowError) throw borrowError;

      const { error: transactionError } = await supabase
        .from("checkout_transactions")
        .insert({
          customer_id: selectedMember.id,
          status: "Completed",
          payment_method: "Borrow",
          total_amount: 0,
          date: new Date().toISOString(),
          user_id: userId,
        });

      if (transactionError) throw transactionError;

      toast({
        description: (
          <div className="flex items-center font-medium">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            {selectedBook.title} has been checked out to {selectedMember.name}
          </div>
        ),
        className: "text-green-600",
      });

      setSelectedBook(null);
      setSelectedMember(null);
      setBookSearchQuery("");
      setMemberSearchQuery("");
      setDueDateOption("15days");
      setDueDate(getDueDateFromOption("15days"));

      if (selectedCategory !== "all") {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        const from = 0;
        const to = BOOKS_PER_PAGE - 1;

        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("category", selectedCategory)
          .eq("user_id", userId)
          .gt("stock", 0)
          .order("title")
          .range(from, to);

        if (!error) {
          const formattedBooks = data.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            publisher: book.publisher,
            publicationYear: book.publication_year,
            description: book.description,
            pageCount: book.page_count,
            category: book.category,
            coverImage: book.cover_image,
            language: book.language,
            price: book.price,
            stock: book.stock,
            status: book.status,
            rating: book.rating,
            tags: book.tags,
            location: book.location,
            created_at: book.created_at,
            updated_at: book.updated_at,
            user_id: book.user_id,
          }));

          setBookSearchResults(formattedBooks || []);
          setPage(1);
        }
      } else {
        setBookSearchResults([]);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({
        title: "Checkout Failed",
        description:
          error.message || "There was an error processing the checkout.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckInMemberSearch = async (query) => {
    if (!query || query.trim() === "") {
      setCheckInMemberResults([]);
      return;
    }

    setIsSearchingMembers(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .or(
          `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
        )
        .order("name");

      if (error) throw error;

      setCheckInMemberResults(data || []);
    } catch (error) {
      console.error("Error searching members:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search members. Please try again.",
      });
      setCheckInMemberResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const handleCheckInMemberSelect = (member) => {
    setSelectedCheckInMember(member);
    setCheckInMemberOpen(false);
    setCheckInMemberQuery(member.name || "");
    fetchMemberCheckouts(member.id);
  };

  const fetchMemberCheckouts = async (memberId) => {
    setIsLoadingCheckouts(true);
    try {
      const { data, error } = await supabase
        .from("borrowings")
        .select("*, books:book_id(*)")
        .eq("member_id", memberId)
        .eq("status", "Borrowed");

      if (error) throw error;

      setMemberCheckouts(data || []);

      if (data.length === 0) {
        toast({
          title: "No Checkouts Found",
          description: "This member doesn't have any active checkouts.",
        });
      }
    } catch (error) {
      console.error("Error fetching checkouts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch member checkouts. Please try again.",
        variant: "destructive",
      });
      setMemberCheckouts([]);
    } finally {
      setIsLoadingCheckouts(false);
    }
  };

  const handleCheckIn = async (borrowingId, bookId) => {
    setReturningBookIds((prev) => ({ ...prev, [borrowingId]: true }));

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { error: borrowingError } = await supabase
        .from("borrowings")
        .update({
          status: "Returned",
          return_date: new Date().toISOString(),
          reminder_sent: false,
          reminder_date: new Date().toISOString(),
        })
        .eq("id", borrowingId);

      if (borrowingError) throw borrowingError;

      const { data: bookData, error: bookFetchError } = await supabase
        .from("books")
        .select("stock")
        .eq("id", bookId)
        .single();

      if (bookFetchError) throw bookFetchError;

      const { error: bookUpdateError } = await supabase
        .from("books")
        .update({
          stock: (bookData.stock || 0) + 1,
          status: "Available",
        })
        .eq("id", bookId);

      if (bookUpdateError) throw bookUpdateError;

      const { error: transactionError } = await supabase
        .from("checkout_transactions")
        .insert({
          customer_id: selectedCheckInMember.id,
          status: "Completed",
          payment_method: "Return",
          total_amount: 0,
          date: new Date().toISOString(),

          user_id: userId,
        });

      if (transactionError) throw transactionError;

      setMemberCheckouts((prev) =>
        prev.filter((checkout) => checkout.id !== borrowingId),
      );

      toast({
        description: (
          <div className="flex items-center font-medium">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Book returned successfully
          </div>
        ),
        className: "text-green-600",
      });
    } catch (error) {
      console.error("Error checking in book:", error);
      toast({
        title: "Check-in Failed",
        description:
          error.message || "There was an error processing the check-in.",
        variant: "destructive",
      });
    } finally {
      setReturningBookIds((prev) => ({ ...prev, [borrowingId]: false }));
    }
  };

  const loadDueBooksData = async () => {
    setIsLoadingDueBooks(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from("borrowings")
        .select("*, books:book_id(*), members:member_id(*)")
        .eq("status", "Borrowed")
        .eq("user_id", userId);

      if (error) throw error;

      const dueSoon = data.filter((checkout) => {
        const dueDate = new Date(checkout.due_date);
        return dueDate > now && dueDate <= oneWeekFromNow;
      });

      const overdue = data.filter((checkout) => {
        const dueDate = new Date(checkout.due_date);
        return dueDate < now;
      });

      setDueSoonBooks(dueSoon || []);
      setOverdueBooks(overdue || []);
    } catch (error) {
      console.error("Error loading due books:", error);
      toast({
        title: "Error",
        description: "Failed to load due dates information.",
        variant: "destructive",
      });
      setDueSoonBooks([]);
      setOverdueBooks([]);
    } finally {
      setIsLoadingDueBooks(false);
    }
  };

  const handleSendReminder = async (borrowingId, memberName, bookTitle) => {
    try {
      const { error } = await supabase
        .from("borrowings")
        .update({
          reminder_sent: true,
          reminder_date: new Date().toISOString(),
        })
        .eq("id", borrowingId);

      if (error) throw error;

      toast({
        title: "Reminder Sent",
        description: `Reminder sent to ${memberName} for "${bookTitle}".`,
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Reminder Failed",
        description:
          error.message || "There was an error sending the reminder.",
        variant: "destructive",
      });
    }
  };

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Error",
        description: "Failed to load members. Please try again.",
        variant: "destructive",
      });
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const getFilteredMembers = () => {
    if (!memberQuery) return members;

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(memberQuery.toLowerCase()) ||
        (member.email &&
          member.email.toLowerCase().includes(memberQuery.toLowerCase())) ||
        (member.phone &&
          member.phone.toLowerCase().includes(memberQuery.toLowerCase())),
    );
  };

  const handleViewMember = (memberId) => {
    setSelectedMemberId(memberId);
    setMemberDetailOpen(true);
  };

  const handleBulkCheckIn = async () => {
    if (selectedCheckouts.length === 0) return;

    setIsProcessingBulkReturn(true);

    try {
      for (const checkout of selectedCheckouts) {
        await handleCheckIn(checkout.id, checkout.book_id);
      }

      toast({
        description: (
          <div className="flex items-center font-medium">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            {selectedCheckouts.length} books returned successfully
          </div>
        ),
        className: "text-green-600",
      });

      setSelectedCheckouts([]);
    } catch (error) {
      console.error("Error processing bulk returns:", error);
      toast({
        title: "Return Failed",
        description:
          "There was an error processing some returns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBulkReturn(false);
    }
  };

  const toggleCheckoutSelection = (checkout) => {
    setSelectedCheckouts((prev) => {
      if (prev.some((item) => item.id === checkout.id)) {
        return prev.filter((item) => item.id !== checkout.id);
      }

      if (prev.length < 5) {
        return [...prev, checkout];
      }

      toast({
        title: "Selection Limit Reached",
        description: "You can only return up to 5 books at once.",
        variant: "default",
      });

      return prev;
    });
  };

  const filteredMembers = getFilteredMembers();

  return (
    <div className="page-transition space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Circulation Hub</h1>
          <p className="text-muted-foreground">
            Manage book loans, due dates, and member information
          </p>
        </div>
      </div>

      <Tabs defaultValue="checkout" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="checkout">Check Out</TabsTrigger>
          <TabsTrigger value="checkin">Check In</TabsTrigger>
          <TabsTrigger value="due-dates">Due Dates</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="checkout">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Find Book</CardTitle>
                <CardDescription>
                  Search for a book by title, author, or select a category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 max-w-[calc(100%-190px)]">
                    <Popover
                      open={bookSearchOpen}
                      onOpenChange={setBookSearchOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bookSearchOpen}
                          className="justify-between w-full"
                        >
                          <div className="flex-1 overflow-hidden">
                            <span className="block truncate text-left">
                              {bookSearchQuery
                                ? bookSearchQuery
                                : "Search for a book..."}
                            </span>
                          </div>
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <div className="overflow-hidden rounded-md border border-slate-100 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                          <div className="flex flex-col">
                            <div className="flex items-center border-b px-3 dark:border-slate-800">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                value={bookSearchQuery}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setBookSearchQuery(value);
                                  handleBookSearch(value);
                                }}
                                placeholder="Search books..."
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>

                            {isSearchingBooks ? (
                              <div className="py-6 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground mt-2">
                                  Searching books...
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-[300px] overflow-y-auto">
                                {bookSearchResults.length === 0 ? (
                                  <p className="p-4 text-sm text-center text-slate-500">
                                    No books found.
                                  </p>
                                ) : (
                                  <div className="p-1">
                                    {bookSearchResults.map((book) => (
                                      <div
                                        key={book.id}
                                        onClick={() => handleBookSelect(book)}
                                        className="relative flex cursor-default select-none items-center rounded-sm p-2 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800"
                                      >
                                        <div className="flex items-start gap-2 w-full">
                                          <div className="h-10 w-8 bg-muted flex items-center justify-center flex-shrink-0">
                                            {book.coverImage ? (
                                              <img
                                                src={book.coverImage}
                                                alt={book.title}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <BookIcon className="h-4 w-4 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="flex-1 overflow-hidden">
                                            <p className="truncate font-medium">
                                              {book.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                              by {book.author} • {book.stock}{" "}
                                              available
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="w-[180px] flex-shrink-0">
                    {" "}
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingCategoryBooks && page === 1 ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading books...
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedCategory === "all" &&
                      !selectedBook &&
                      bookSearchResults.length === 0 && (
                        <div className="text-center py-8 border rounded-md bg-muted/10">
                          <BookIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                          <h3 className="mt-2 font-medium">
                            No Books Selected
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                            Search for a book by title or author, or select a
                            category from the dropdown to view available books.
                          </p>
                        </div>
                      )}

                    {selectedCategory !== "all" &&
                      bookSearchResults.length > 0 &&
                      !selectedBook && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-2">
                            Books in {selectedCategory} category:
                          </h3>
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                            {bookSearchResults.map((book) => (
                              <div
                                key={book.id}
                                className="p-3 rounded-md cursor-pointer border hover:bg-muted/50"
                                onClick={() => handleBookSelect(book)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="h-10 w-8 bg-muted flex items-center justify-center flex-shrink-0">
                                    {book.coverImage ? (
                                      <img
                                        src={book.coverImage}
                                        alt={book.title}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <BookIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {book.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">
                                      {book.author}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Available: {book.stock}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {isLoadingCategoryBooks && page > 1 && (
                            <div className="text-center py-3">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                              <p className="text-xs text-muted-foreground mt-1">
                                Loading more books...
                              </p>
                            </div>
                          )}

                          {hasMore && !isLoadingCategoryBooks && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={handleLoadMore}
                            >
                              Load More Books
                            </Button>
                          )}
                        </div>
                      )}

                    {selectedBook && (
                      <Card className="mt-4">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="h-24 w-16 bg-muted flex items-center justify-center flex-shrink-0">
                              {selectedBook.coverImage ? (
                                <img
                                  src={selectedBook.coverImage}
                                  alt={selectedBook.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <BookIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-lg truncate">
                                {selectedBook.title}
                              </h3>
                              <p className="text-muted-foreground truncate">
                                by {selectedBook.author}
                              </p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge variant="outline">
                                  ISBN: {selectedBook.isbn}
                                </Badge>
                                <Badge variant="outline">
                                  {selectedBook.stock} available
                                </Badge>
                                {selectedBook.category && (
                                  <Badge variant="secondary">
                                    {selectedBook.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedBook(null)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checkout Information</CardTitle>
                <CardDescription>
                  Select a member and set a due date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberSearch">Member</Label>
                    <Popover
                      open={memberSearchOpen}
                      onOpenChange={setMemberSearchOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="memberSearch"
                          variant="outline"
                          role="combobox"
                          aria-expanded={memberSearchOpen}
                          className="justify-between w-full"
                        >
                          <span className="truncate">
                            {memberSearchQuery
                              ? memberSearchQuery
                              : "Search for a member..."}
                          </span>
                          <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <div className="overflow-hidden rounded-md border border-slate-100 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                          <div className="flex flex-col">
                            <div className="flex items-center border-b px-3 dark:border-slate-800">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                value={memberSearchQuery}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setMemberSearchQuery(value);
                                  handleMemberSearch(value);
                                }}
                                placeholder="Search by name, email, or phone..."
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>

                            {isSearchingMembers ? (
                              <div className="py-6 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                <p className="text-sm text-muted-foreground mt-2">
                                  Searching members...
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-[300px] overflow-y-auto">
                                {memberSearchResults.length === 0 ? (
                                  <p className="p-4 text-sm text-center text-slate-500">
                                    No members found.
                                  </p>
                                ) : (
                                  <div className="p-1">
                                    {memberSearchResults.map((member) => (
                                      <div
                                        key={member.id}
                                        onClick={() =>
                                          handleMemberSelect(member)
                                        }
                                        className="relative flex cursor-default select-none items-center rounded-sm p-2 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800"
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                              {member.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                              {member.email}{" "}
                                              {member.phone &&
                                                `• ${member.phone}`}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedMember && (
                    <div className="p-3 rounded-md bg-secondary">
                      <div className="flex justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">
                            {selectedMember.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {selectedMember.email}
                            {selectedMember.phone &&
                              ` • ${selectedMember.phone}`}
                          </p>
                          <Badge
                            className={cn(
                              "mt-2",
                              selectedMember.status === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : selectedMember.status === "Inactive"
                                  ? "bg-zinc-100 text-zinc-800"
                                  : "bg-amber-100 text-amber-800",
                            )}
                          >
                            {selectedMember.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMember(null);
                            setMemberSearchQuery("");
                          }}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Loan Duration</Label>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={
                          dueDateOption === "15days" ? "default" : "outline"
                        }
                        className={cn(
                          "flex items-center justify-center",
                          dueDateOption === "15days" && "relative font-medium",
                        )}
                        onClick={() => setDueDateOption("15days")}
                      >
                        {dueDateOption === "15days" && (
                          <div className="absolute left-2">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        )}
                        <span>15 days</span>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          dueDateOption === "20days" ? "default" : "outline"
                        }
                        className={cn(
                          "flex items-center justify-center",
                          dueDateOption === "20days" && "relative font-medium",
                        )}
                        onClick={() => setDueDateOption("20days")}
                      >
                        {dueDateOption === "20days" && (
                          <div className="absolute left-2">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        )}
                        <span>20 days</span>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          dueDateOption === "30days" ? "default" : "outline"
                        }
                        className={cn(
                          "flex items-center justify-center",
                          dueDateOption === "30days" && "relative font-medium",
                        )}
                        onClick={() => setDueDateOption("30days")}
                      >
                        {dueDateOption === "30days" && (
                          <div className="absolute left-2">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        )}
                        <span>30 days</span>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          dueDateOption === "custom" ? "default" : "outline"
                        }
                        className={cn(
                          "flex items-center justify-center",
                          dueDateOption === "custom" && "relative font-medium",
                        )}
                        onClick={() => setDueDateOption("custom")}
                      >
                        {dueDateOption === "custom" && (
                          <div className="absolute left-2">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        )}
                        <span>Custom</span>
                      </Button>
                    </div>

                    {showCustomDatePicker && (
                      <div className="pt-2">
                        <Label htmlFor="dueDate">Select Custom Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {dueDate && (
                      <div className="bg-muted p-2 rounded-md mt-2">
                        <p className="text-sm flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Due date:{" "}
                          <span className="font-medium ml-1">
                            {new Date(dueDate).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={
                    !selectedBook ||
                    !selectedMember ||
                    !dueDate ||
                    isCheckingOut
                  }
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <BookIcon className="mr-2 h-4 w-4" />
                      Checkout Book
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checkin">
          <Card>
            <CardHeader>
              <CardTitle>Check In Books</CardTitle>
              <CardDescription>
                Return books and update library records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label htmlFor="checkInMember">Select Member</Label>
                <Popover
                  open={checkInMemberOpen}
                  onOpenChange={setCheckInMemberOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="checkInMember"
                      variant="outline"
                      role="combobox"
                      aria-expanded={checkInMemberOpen}
                      className="justify-between w-full"
                    >
                      <span className="truncate">
                        {checkInMemberQuery
                          ? checkInMemberQuery
                          : "Search for a member..."}
                      </span>
                      <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="overflow-hidden rounded-md border border-slate-100 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b px-3 dark:border-slate-800">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            value={checkInMemberQuery}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCheckInMemberQuery(value);
                              handleCheckInMemberSearch(value);
                            }}
                            placeholder="Search by name, email, or phone..."
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>

                        {isSearchingMembers ? (
                          <div className="py-6 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground mt-2">
                              Searching members...
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[300px] overflow-y-auto">
                            {checkInMemberResults.length === 0 ? (
                              <p className="p-4 text-sm text-center text-slate-500">
                                No members found.
                              </p>
                            ) : (
                              <div className="p-1">
                                {checkInMemberResults.map((member) => (
                                  <div
                                    key={member.id}
                                    onClick={() =>
                                      handleCheckInMemberSelect(member)
                                    }
                                    className="relative flex cursor-default select-none items-center rounded-sm p-2 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                          {member.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">
                                          {member.email}{" "}
                                          {member.phone && `• ${member.phone}`}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {isLoadingCheckouts && (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">
                    Loading checkouts...
                  </p>
                </div>
              )}

              {!isLoadingCheckouts && memberCheckouts.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        {selectedCheckouts.length} of {memberCheckouts.length}{" "}
                        books selected
                      </span>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkCheckIn}
                      disabled={
                        selectedCheckouts.length === 0 || isProcessingBulkReturn
                      }
                    >
                      {isProcessingBulkReturn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Returning Books...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Return Selected Books
                        </>
                      )}
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Checkout Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberCheckouts.map((checkout) => {
                        const dueDate = new Date(checkout.due_date);
                        const isOverdue = dueDate < new Date();
                        const isReturning = returningBookIds[checkout.id];
                        const isSelected = selectedCheckouts.some(
                          (item) => item.id === checkout.id,
                        );

                        return (
                          <TableRow
                            key={checkout.id}
                            className={isSelected ? "bg-muted/50" : ""}
                          >
                            <TableCell className="w-[40px]">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  className={`h-5 w-5 rounded-md border border-primary ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-background"
                                  } flex items-center justify-center`}
                                  onClick={() =>
                                    toggleCheckoutSelection(checkout)
                                  }
                                  disabled={isReturning}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {checkout.books.title}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                checkout.checkout_date,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {dueDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {isOverdue ? (
                                <Badge variant="destructive">Overdue</Badge>
                              ) : (
                                <Badge variant="outline">Checked Out</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCheckIn(checkout.id, checkout.book_id)
                                }
                                disabled={isReturning}
                              >
                                {isReturning ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Returning...
                                  </>
                                ) : (
                                  "Return Book"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}

              {!isLoadingCheckouts &&
                selectedCheckInMember &&
                memberCheckouts.length === 0 && (
                  <div className="text-center py-6 border rounded-md bg-muted/10">
                    <BookIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-2 font-medium">No Active Checkouts</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCheckInMember.name} doesn't have any books
                      checked out
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="due-dates">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Books Due Soon</CardTitle>
                <CardDescription>
                  Books due within the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDueBooks ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">
                      Loading due books...
                    </p>
                  </div>
                ) : dueSoonBooks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dueSoonBooks.map((checkout) => (
                        <TableRow key={checkout.id}>
                          <TableCell className="font-medium">
                            {checkout.books.title}
                          </TableCell>
                          <TableCell>{checkout.members.name}</TableCell>
                          <TableCell>
                            {new Date(checkout.due_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSendReminder(
                                  checkout.id,
                                  checkout.members.name,
                                  checkout.books.title,
                                )
                              }
                            >
                              Send Reminder
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No books due soon.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue Books</CardTitle>
                <CardDescription>
                  Books that are past their due date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDueBooks ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">
                      Loading overdue books...
                    </p>
                  </div>
                ) : overdueBooks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueBooks.map((checkout) => {
                        const dueDate = new Date(checkout.due_date);
                        const today = new Date();
                        const diffTime = today.getTime() - dueDate.getTime();
                        const daysOverdue = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );

                        return (
                          <TableRow key={checkout.id}>
                            <TableCell className="font-medium">
                              {checkout.books.title}
                            </TableCell>
                            <TableCell>{checkout.members.name}</TableCell>
                            <TableCell>
                              {dueDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {daysOverdue} days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSendReminder(
                                    checkout.id,
                                    checkout.members.name,
                                    checkout.books.title,
                                  )
                                }
                              >
                                Send Reminder
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No overdue books.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Library Members</CardTitle>
              <CardDescription>View and manage library members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, email, or phone..."
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isLoadingMembers ? (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">
                    Loading members...
                  </p>
                </div>
              ) : filteredMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name}
                        </TableCell>
                        <TableCell>{member.email || "—"}</TableCell>
                        <TableCell>{member.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              member.status === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : member.status === "Inactive"
                                  ? "bg-zinc-100 text-zinc-800"
                                  : "bg-amber-100 text-amber-800",
                            )}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMember(member.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/10">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 font-medium">No Members Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {memberQuery
                      ? "No members match your search criteria"
                      : "You haven't added any library members yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={memberDetailOpen} onOpenChange={setMemberDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedMemberId && (
            <MemberDetail
              memberId={selectedMemberId}
              onClose={() => setMemberDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookCirculation;
