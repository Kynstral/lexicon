import React, { useEffect, useState } from "react";
import {
  BookMarked,
  BookOpen,
  Grid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Book, BookCategory, BookStatus } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALL_CATEGORIES = "all_categories";
const ALL_PUBLISHERS = "all_publishers";
const ALL_YEARS = "all_years";

const fetchBooks = async (userId: string | null): Promise<Book[]> => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", userId)
    .order("title");

  if (error) {
    throw new Error(`Error fetching books: ${error.message}`);
  }

  return data.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    category: book.category as BookCategory,
    publicationYear: book.publication_year,
    publisher: book.publisher,
    description: book.description || "",
    price: book.price,
    status: book.status as BookStatus,
    coverImage: book.cover_image || "",
    stock: book.stock,
    location: book.location,
    rating: book.rating,
    pageCount: book.page_count,
    language: book.language,
    tags: book.tags,
    user_id: book.user_id,
    salesCount: book.sales_count,
  }));
};

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | string>(
    ALL_CATEGORIES,
  );
  const [publisherFilter, setPublisherFilter] =
    useState<string>(ALL_PUBLISHERS);
  const [yearFilter, setYearFilter] = useState<string>(ALL_YEARS);
  const [priceRange, setPriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { userId } = useAuth();

  useEffect(() => {
    setIsFilterActive(
      categoryFilter !== ALL_CATEGORIES ||
        publisherFilter !== ALL_PUBLISHERS ||
        yearFilter !== ALL_YEARS ||
        !!priceRange ||
        !!searchQuery,
    );
  }, [categoryFilter, publisherFilter, yearFilter, priceRange, searchQuery]);

  const {
    data: books = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["catalog-books", userId],
    queryFn: () => fetchBooks(userId),
    enabled: !!userId,
  });

  const categories = Array.from(new Set(books.map((book) => book.category)));
  const publishers = Array.from(new Set(books.map((book) => book.publisher)));
  const years = Array.from(
    new Set(books.map((book) => book.publicationYear)),
  ).sort((a, b) => b - a);

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      !searchQuery ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery);

    const matchesCategory =
      categoryFilter === ALL_CATEGORIES || book.category === categoryFilter;
    const matchesPublisher =
      publisherFilter === ALL_PUBLISHERS || book.publisher === publisherFilter;
    const matchesYear =
      yearFilter === ALL_YEARS ||
      book.publicationYear.toString() === yearFilter;
    const matchesPriceRange =
      !priceRange ||
      (book.price >= priceRange.min && book.price <= priceRange.max);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPublisher &&
      matchesYear &&
      matchesPriceRange
    );
  });

  const handleViewBook = (book: Book) => {
    navigate(`/book/${book.id}`);
  };

  const clearAllFilters = () => {
    setCategoryFilter(ALL_CATEGORIES);
    setPublisherFilter(ALL_PUBLISHERS);
    setYearFilter(ALL_YEARS);
    setPriceRange(null);
    setSearchQuery("");
    setDrawerOpen(false);
  };

  const getStockStatusColor = (book: Book) => {
    if (book.stock === 0) return "bg-red-100 text-red-800 border-red-200";
    if (book.stock <= 5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  const getStockStatusText = (book: Book) => {
    if (book.stock === 0) return "Out of Stock";
    if (book.stock <= 5) return `${book.stock} left`;
    return "In Stock";
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Fiction: "text-blue-600 bg-blue-50 border-blue-200",
      "Non-Fiction": "text-purple-600 bg-purple-50 border-purple-200",
      Science: "text-emerald-600 bg-emerald-50 border-emerald-200",
      Technology: "text-cyan-600 bg-cyan-50 border-cyan-200",
      Business: "text-amber-600 bg-amber-50 border-amber-200",
      Biography: "text-rose-600 bg-rose-50 border-rose-200",
      History: "text-indigo-600 bg-indigo-50 border-indigo-200",
      Romance: "text-pink-600 bg-pink-50 border-pink-200",
      Mystery: "text-violet-600 bg-violet-50 border-violet-200",
      Fantasy: "text-teal-600 bg-teal-50 border-teal-200",
    };

    return colors[category] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute top-0 w-full h-full rounded-md border-4 border-primary/40 border-t-primary animate-spin"></div>
            <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary/70" />
          </div>
          <p className="text-muted-foreground animate-pulse">
            Loading your catalog...
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 rounded-lg border bg-card">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground">
            Please sign in to view your book catalog.
          </p>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 rounded-lg border bg-destructive/10">
          <X className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2 text-destructive">
            Error Loading Catalog
          </h2>
          <p className="text-muted-foreground mb-4">
            We encountered a problem loading your catalog. Please try again
            later.
          </p>
          <Button
            variant="destructive"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const FilterDrawer = () => (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex md:hidden items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {isFilterActive && (
            <Badge className="h-2 w-2 p-0 rounded-full bg-primary" />
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Books</DrawerTitle>
          <DrawerDescription>
            Apply filters to narrow your search
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="px-4 py-2 max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Category
              </Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Publisher
              </Label>
              <Select
                value={publisherFilter}
                onValueChange={(value) => setPublisherFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Publisher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PUBLISHERS}>All Publishers</SelectItem>
                  {publishers.map((publisher) => (
                    <SelectItem key={publisher} value={publisher}>
                      {publisher}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Publication Year
              </Label>
              <Select
                value={yearFilter}
                onValueChange={(value) => setYearFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_YEARS}>All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>
        <DrawerFooter className="flex flex-row gap-3">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button onClick={() => setDrawerOpen(false)} className="flex-1">
            Apply Filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-7 w-7" />
            Catalog
          </h2>
          <p className="text-muted-foreground mt-1">
            Browse and manage your book collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FilterDrawer />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid View</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>List View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 order-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-muted"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="hidden md:flex gap-2 order-2">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={publisherFilter}
            onValueChange={(value) => setPublisherFilter(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Publisher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PUBLISHERS}>All Publishers</SelectItem>
              {publishers.map((publisher) => (
                <SelectItem key={publisher} value={publisher}>
                  {publisher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={yearFilter}
            onValueChange={(value) => setYearFilter(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_YEARS}>All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {filteredBooks.length > 0 ? (
        <>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "book" : "books"} found
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredBooks.map((book) => (
                <Card
                  key={book.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all group border"
                  onClick={() => handleViewBook(book)}
                >
                  <div className="aspect-[2/3] relative overflow-hidden bg-muted">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getStockStatusColor(book)}`}
                      >
                        {getStockStatusText(book)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getCategoryColor(book.category)}`}
                      >
                        {book.category}
                      </Badge>
                      <h3 className="font-medium text-sm line-clamp-1 leading-tight mt-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.author}
                      </p>
                      <div className="flex justify-between items-center pt-1">
                        <div className="text-sm font-bold">
                          ${book.price.toFixed(2)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewBook(book);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBooks.map((book) => (
                <Card
                  key={book.id}
                  className="overflow-hidden hover:shadow-sm transition-shadow group"
                  onClick={() => handleViewBook(book)}
                >
                  <div className="flex flex-row">
                    <div className="w-24 sm:w-32 h-auto aspect-[2/3] relative overflow-hidden bg-muted flex-shrink-0">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="flex-1 p-3 sm:p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCategoryColor(book.category)}`}
                        >
                          {book.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStockStatusColor(book)}`}
                        >
                          {getStockStatusText(book)}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <h3 className="font-medium text-base sm:text-lg leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          by {book.author} • {book.publicationYear}
                        </p>
                      </div>

                      <div className="flex-grow">
                        <p className="text-xs sm:text-sm line-clamp-2 text-muted-foreground">
                          {book.description || "No description available."}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <div className="flex items-baseline gap-2">
                          <div className="text-base sm:text-lg font-bold">
                            ${book.price.toFixed(2)}
                          </div>
                          {book.stock > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {book.stock} in stock
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewBook(book);
                          }}
                          className="h-8"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 mt-6 border rounded-lg bg-muted/10">
          <div className="bg-muted inline-flex rounded-full p-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No Books Found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            We couldn't find any books matching your search criteria. Try
            adjusting your filters or adding new books to your catalog.
          </p>
          {isFilterActive && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const Label = ({ children, className = "", ...props }) => (
  <label className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </label>
);

export default Catalog;
