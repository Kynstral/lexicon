/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection ExceptionCaughtLocallyJS

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BookUp,
  CalendarDays,
  Library,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, DashboardStats } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  stats: DashboardStats;
  recentBooks: Book[];
  recentBorrowings: any[];
  onAddToCart: (book: Book) => void;
  userId: string;
}

const LibraryDashboard = ({
  stats,
  recentBooks,
  recentBorrowings,
  onAddToCart,
  userId,
}: DashboardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [localBorrowings, setLocalBorrowings] = useState<any[]>([]);
  const { toast } = useToast();

  const userBorrowings =
    localBorrowings.length > 0
      ? localBorrowings.filter((borrowing) => borrowing.user_id === userId)
      : recentBorrowings.filter((borrowing) => borrowing.user_id === userId);

  useEffect(() => {
    setLocalBorrowings(recentBorrowings);
  }, [recentBorrowings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  const handleClearBorrowings = async () => {
    if (!userId) return;

    setIsClearing(true);
    try {
      const { error } = await supabase
        .from("borrowings")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setLocalBorrowings(
        localBorrowings.filter((borrowing) => borrowing.user_id !== userId),
      );

      toast({
        title: "Borrowings Cleared",
        description: "All borrowing records have been cleared successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error clearing borrowings:", error);
      toast({
        title: "Error",
        description: "Failed to clear borrowing records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteBorrowing = async (borrowingId: string) => {
    if (!borrowingId) return;

    try {
      const { error } = await supabase
        .from("borrowings")
        .delete()
        .eq("id", borrowingId);

      if (error) throw error;

      setLocalBorrowings(
        localBorrowings.filter((borrowing) => borrowing.id !== borrowingId),
      );

      toast({
        title: "Record Removed",
        description: "Borrowing record has been removed successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting borrowing:", error);
      toast({
        title: "Error",
        description: "Failed to remove borrowing record. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Lexicon, your library management system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              in the library collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              registered library members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
            <BookUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              books borrowed & returned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Activity
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userBorrowings.filter((b) => b.status === "Borrowed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              books currently borrowed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent-books">Recent Books</TabsTrigger>
          <TabsTrigger value="borrowings">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common library tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" asChild>
                  <Link to="/book-circulation">
                    <BookUp className="h-4 w-4 mr-2" />
                    Book Circulation
                  </Link>
                </Button>

                <Button className="w-full justify-start" asChild>
                  <Link to="/members">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Link>
                </Button>
                <Button className="w-full justify-start" asChild>
                  <Link to="/catalog">
                    <Library className="h-4 w-4 mr-2" />
                    Browse Catalog
                  </Link>
                </Button>

                {/* Added Clear Borrowings button */}
                <Button
                  className="w-full justify-start"
                  variant="destructive"
                  onClick={handleClearBorrowings}
                  disabled={isClearing || userBorrowings.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isClearing ? "Clearing..." : "Clear Borrowings"}
                </Button>
              </CardContent>
            </Card>

            {/* Popular Books */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Popular Books</CardTitle>
                <CardDescription>Most borrowed titles</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.popularBooks && stats.popularBooks.length > 0 ? (
                  <ul className="space-y-4">
                    {stats.popularBooks.slice(0, 5).map((book) => (
                      <li key={book.id} className="flex items-center">
                        <div className="h-12 w-9 bg-secondary rounded overflow-hidden flex-shrink-0">
                          {book.coverImage && (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                          <Link
                            to={`/book/${book.id}`}
                            className="font-medium hover:text-primary truncate block"
                          >
                            {book.title}
                          </Link>
                          <p className="text-sm text-muted-foreground truncate">
                            {book.author}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-8 w-8 opacity-50" />
                    <p className="mt-2">No popular books data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Borrowings */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Recent Borrowings</CardTitle>
                {userBorrowings.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground"
                    onClick={handleClearBorrowings}
                    disabled={isClearing}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {userBorrowings && userBorrowings.length > 0 ? (
                  <ul className="space-y-4">
                    {userBorrowings.slice(0, 5).map((borrowing) => (
                      <li key={borrowing.id} className="flex items-start group">
                        <div className="rounded-full bg-secondary p-1.5 flex-shrink-0">
                          <BookUp className="h-3 w-3" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium">
                              {borrowing.members?.name || "Unknown Member"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                handleDeleteBorrowing(borrowing.id)
                              }
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            borrowed{" "}
                            <Link
                              to={`/book/${borrowing.book_id}`}
                              className="font-medium hover:text-primary"
                            >
                              {borrowing.books?.title || "Unknown Book"}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(borrowing.checkout_date),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <BookUp className="mx-auto h-8 w-8 opacity-50" />
                    <p className="mt-2">No recent borrowings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Books Tab - Redesigned with table-style layout */}
        <TabsContent value="recent-books" className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4 flex items-center justify-between border-b">
              <h2 className="text-xl font-semibold">Recently Added Books</h2>
              <Button size="sm" asChild>
                <Link to="/catalog">
                  <Search className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
            <div className="divide-y">
              {recentBooks && recentBooks.length > 0 ? (
                recentBooks.slice(0, 10).map((book) => (
                  <div
                    key={book.id}
                    className="p-4 flex items-start hover:bg-muted/50"
                  >
                    <div className="h-16 w-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                      {book.coverImage && (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">
                            <Link
                              to={`/book/${book.id}`}
                              className="hover:text-primary"
                            >
                              {book.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {book.author}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              book.status === "Available"
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {book.status}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => onAddToCart(book)}
                            disabled={
                              book.stock <= 0 || book.status !== "Available"
                            }
                            className="h-8"
                          >
                            <BookUp className="h-3.5 w-3.5 mr-1" />
                            Checkout
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-sm">
                          {book.category && (
                            <span className="text-muted-foreground mr-2">
                              Genre:{" "}
                              <span className="font-medium">
                                {book.category}
                              </span>
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            ISBN:{" "}
                            <span className="font-medium">
                              {book.isbn || "N/A"}
                            </span>
                          </span>
                        </div>
                        <div className="text-xs">
                          {book.stock > 0 && (
                            <span className="text-muted-foreground">
                              {book.stock} in stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-4">No books found</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Borrowings Tab - Without Modal */}
        {/* Borrowings Tab - Without Modal */}
        <TabsContent value="borrowings" className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4 flex items-center justify-between border-b">
              <h2 className="text-xl font-semibold">Borrowing Activity</h2>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearBorrowings}
                disabled={isClearing || userBorrowings.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isClearing ? "Clearing..." : "Clear All"}
              </Button>
            </div>
            <div className="divide-y">
              {userBorrowings && userBorrowings.length > 0 ? (
                userBorrowings.map((borrowing) => {
                  const isReturned = borrowing.status === "Returned";
                  return (
                    <div
                      key={borrowing.id}
                      className="p-4 flex items-start hover:bg-muted/50 group"
                    >
                      <div className="h-16 w-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {borrowing.books?.cover_image && (
                          <img
                            src={borrowing.books.cover_image}
                            alt={borrowing.books?.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">
                              <Link
                                to={`/book/${borrowing.book_id}`}
                                className="hover:text-primary"
                              >
                                {borrowing.books?.title || "Unknown Book"}
                              </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {borrowing.books?.author || "Unknown Author"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                isReturned
                                  ? "bg-muted text-muted-foreground"
                                  : borrowing.status === "Overdue"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-primary/10 text-primary"
                              }`}
                            >
                              {borrowing.status}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                handleDeleteBorrowing(borrowing.id)
                              }
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Borrowed by:{" "}
                            </span>
                            <Link
                              to={`/members/${borrowing.member_id}`}
                              className="font-medium hover:text-primary"
                            >
                              {borrowing.members?.name || "Unknown"}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isReturned
                              ? `Returned ${formatDistanceToNow(new Date(borrowing.return_date), { addSuffix: true })}`
                              : `Due ${formatDistanceToNow(new Date(borrowing.due_date), { addSuffix: true })}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <BookUp className="mx-auto h-12 w-12 opacity-40" />
                  <p className="mt-4">No borrowing activity found</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryDashboard;
