import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Book, DashboardStats } from "@/lib/types";
import { getBooks, getDashboardStats } from "@/lib/data-service";
import LibraryDashboard from "@/components/LibraryDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthStatusProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Info,
  RefreshCcw,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const Index = () => {
  const navigate = useNavigate();
  const { userRole, userId } = useAuth();
  const [recentlyBorrowed, setRecentlyBorrowed] = useState<
    Record<string, unknown>[]
  >([]);
  const [timeRange, setTimeRange] = useState("monthly");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboardStats", userId],
    queryFn: () => getDashboardStats(userId),
    enabled: !!userId,
  });

  const {
    data: books,
    isLoading: booksLoading,
    error: booksError,
  } = useQuery({
    queryKey: ["books", userId],
    queryFn: () => getBooks(userId),
    enabled: !!userId,
  });

  const { isLoading: borrowingsLoading, error: borrowingsError } = useQuery({
    queryKey: ["recentBorrowings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrowings")
        .select(
          `
          id,
          book_id,
          member_id,
          checkout_date,
          due_date,
          return_date,
          status,
          user_id,
          books:book_id (title, author, cover_image),
          members:member_id (name)
        `,
        )
        .eq("user_id", userId)
        .order("checkout_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentlyBorrowed(data);
      return data;
    },
    enabled: !!userId && userRole === "Library",
  });

  const handleBookCheckout = (book: Book) => {
    navigate("/book-checkout", {
      state: { selectedBook: book, userId: userId },
    });
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    refetchStats().then(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    });
  };

  const getCategoryData = () => {
    if (!books || books.length === 0) return [];

    const categoryCounts = books.reduce((acc, book) => {
      const category = book.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getRevenueData = () => {
    if (
      !dashboardStats?.recentTransactions ||
      dashboardStats.recentTransactions.length === 0
    ) {
      return [];
    }

    const monthlyData = dashboardStats.recentTransactions.reduce(
      (acc, transaction) => {
        const date = new Date(transaction.date);
        const month = date.toLocaleString("default", { month: "short" });

        if (!acc[month]) {
          acc[month] = 0;
        }

        acc[month] += transaction.totalAmount;
        return acc;
      },
      {},
    );

    return Object.entries(monthlyData).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getPaymentMethodData = () => {
    if (
      !dashboardStats?.recentTransactions ||
      dashboardStats.recentTransactions.length === 0
    ) {
      return [];
    }

    const paymentCounts = dashboardStats.recentTransactions.reduce(
      (acc, transaction) => {
        const method = transaction.paymentMethod || "Other";
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(paymentCounts).map(([name, value]) => ({
      name: formatPaymentMethod(name),
      value,
    }));
  };

  const formatPaymentMethod = (method) => {
    if (method === "bank_transfer") return "Bank Transfer";
    if (method === "cash") return "Cash";
    if (method === "card") return "Card";
    if (method === "Borrow") return "Borrow";
    if (method === "Rent") return "Rent";
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const getBestsellingBooks = () => {
    if (
      !dashboardStats?.popularBooks ||
      dashboardStats.popularBooks.length === 0
    ) {
      return [];
    }

    return dashboardStats.popularBooks.slice(0, 5).map((book) => ({
      name: book.title,
      value: book.salesCount,
    }));
  };

  if (
    statsLoading ||
    booksLoading ||
    (userRole === "Library" && borrowingsLoading)
  ) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (statsError || booksError || (userRole === "Library" && borrowingsError)) {
    return (
      <div className="p-8 bg-destructive/10 rounded-lg border border-destructive max-w-md mx-auto mt-12">
        <h2 className="text-xl font-bold text-destructive mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-muted-foreground">
          There was a problem loading the dashboard data. Please try refreshing
          the page.
        </p>
        <pre className="mt-4 p-4 bg-card rounded text-xs overflow-auto">
          {String(
            (statsError as Error)?.message ||
              (booksError as Error)?.message ||
              (borrowingsError as Error)?.message,
          )}
        </pre>
      </div>
    );
  }

  const defaultStats: DashboardStats = {
    totalRevenue: 0,
    totalBooks: 0,
    totalTransactions: 0,
    totalUsers: 0,
    recentTransactions: [],
    popularBooks: [],
  };

  const categoryData = getCategoryData();
  const revenueData = getRevenueData();
  const paymentMethodData = getPaymentMethodData();
  const bestsellingBooks = getBestsellingBooks();

  const BookStoreDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Bookstore Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Last Week</SelectItem>
              <SelectItem value="monthly">Last Month</SelectItem>
              <SelectItem value="quarterly">Last Quarter</SelectItem>
              <SelectItem value="yearly">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Books
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {dashboardStats?.totalBooks || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  ${dashboardStats?.totalRevenue.toFixed(2) || "0.00"}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {dashboardStats?.totalTransactions || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customers
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {dashboardStats?.totalUsers || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Revenue</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  View Report
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={revenueData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`$${value}`, "Revenue"]}
                          contentStyle={{ borderRadius: "8px" }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </ReBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col">
                      <Info className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No revenue data available
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Book Categories
                </CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} books`, "Count"]}
                          contentStyle={{ borderRadius: "8px" }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col">
                      <Info className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No category data available
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Books</CardTitle>
                <CardDescription>
                  Your latest inventory additions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {books && books.length > 0 ? (
                  <div className="space-y-4">
                    {books.slice(0, 5).map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-4 p-2 hover:bg-muted rounded-md transition-colors"
                      >
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-muted flex items-center justify-center rounded">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{book.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {book.author}
                          </p>
                          <p className="text-sm font-medium">
                            ${book.price?.toFixed(2) || "0.00"}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            Stock: {book.stock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No books in inventory yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardStats?.recentTransactions &&
                dashboardStats.recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardStats.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            Order #{transaction.id.substring(0, 8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${transaction.totalAmount.toFixed(2)}
                          </p>
                          <p
                            className={`text-xs ${transaction.status === "Completed" ? "text-green-500" : "text-amber-500"}`}
                          >
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No sales transactions yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end">
            <Button asChild className="gap-1">
              <Link to="/transactions">
                View All Transactions
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Payment Method</CardTitle>
              <CardDescription>Transaction distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} transactions`,
                          "Count",
                        ]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center flex-col">
                    <Info className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No payment method data available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Selling Books</CardTitle>
              <CardDescription>Top performing titles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {bestsellingBooks.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      layout="vertical"
                      data={bestsellingBooks}
                      margin={{ top: 10, right: 10, left: 60, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip
                        formatter={(value) => [`${value} sold`, "Sales"]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#10B981"
                        radius={[0, 4, 4, 0]}
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center flex-col">
                    <Info className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No bestseller data available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <Button asChild className="gap-1">
              <Link to="/sales">
                View Detailed Sales Reports
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
              <CardDescription>Current stock distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip
                        formatter={(value) => [`${value} books`, "Available"]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#3B82F6"
                        radius={[0, 4, 4, 0]}
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center flex-col">
                    <Info className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No inventory data available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <Button asChild className="gap-1">
              <Link to="/inventory">
                Manage Inventory
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="dashboard-gradient min-h-screen page-transition p-4">
      {userRole === "Library" ? (
        <LibraryDashboard
          stats={dashboardStats || defaultStats}
          recentBooks={books || []}
          onAddToCart={handleBookCheckout}
          recentBorrowings={recentlyBorrowed}
          userId={userId}
        />
      ) : (
        <BookStoreDashboard />
      )}
    </div>
  );
};

export default Index;
