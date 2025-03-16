import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Book, BookCategory, BookStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleArrowDown,
  CircleArrowUp,
  Database,
  Eye,
  FileEdit,
  LayoutGrid,
  List,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import BulkBookImport from "@/components/BulkBookImport";
import BulkBookExport from "@/components/BulkBookExport";
import BookForm from "@/components/BookForm";
import { deleteBook } from "@/lib/data-service";

const bookCategories: BookCategory[] = [
  "Action & Adventure",
  "Animals",
  "Anthropology",
  "Art",
  "Biography",
  "Business",
  "Children's Books",
  "Classics",
  "Comics",
  "Contemporary",
  "Cooking",
  "Crafts & Hobbies",
  "Crime",
  "Drama",
  "Dystopian",
  "Economics",
  "Education",
  "Erotica",
  "Essays",
  "Family & Relationships",
  "Fantasy",
  "Fashion",
  "Fiction",
  "Food & Drink",
  "Foreign Languages",
  "Games & Activities",
  "Graphic Novels",
  "Health",
  "Historical Fiction",
  "History",
  "Horror",
  "Humor",
  "Illustrated",
  "Literary Criticism",
  "Literature",
  "Manga",
  "Mathematics",
  "Memoir",
  "Music",
  "Mystery",
  "Mythology",
  "Nature",
  "Non-Fiction",
  "Paranormal",
  "Parenting & Families",
  "Philosophy",
  "Poetry",
  "Politics",
  "Psychology",
  "Religion",
  "Romance",
  "Science",
  "Science Fiction",
  "Self-Help",
  "Short Stories",
  "Social Sciences",
  "Sports & Recreation",
  "Suspense",
  "Technology",
  "Thriller",
  "Travel",
  "True Crime",
  "Young Adult",
];

const bookStatuses: BookStatus[] = [
  "Available",
  "Checked Out",
  "On Hold",
  "Processing",
  "Lost",
  "Out of Stock",
];

export default function BooksPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState({ column: "title", direction: "asc" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [bookFormDialogOpen, setBookFormDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publisherFilter, setPublisherFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", userId, sorting],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", userId)
        .order(sorting.column, { ascending: sorting.direction === "asc" });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching books",
          description: error.message,
        });
        throw error;
      }

      return data.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publisher: book.publisher,
        publicationYear: book.publication_year,
        description: book.description,
        pageCount: book.page_count,
        category: book.category as BookCategory,
        coverImage: book.cover_image || "",
        language: book.language,
        price: book.price,
        stock: book.stock,
        status: book.status as BookStatus,
        rating: book.rating,
        tags: book.tags,
        location: book.location,
        created_at: book.created_at,
        updated_at: book.updated_at,
        user_id: book.user_id,
      })) as Book[];
    },
    enabled: !!userId,
  });

  const uniquePublishers = useMemo(() => {
    return Array.from(new Set(books.map((book) => book.publisher)));
  }, [books]);

  const uniqueYears = useMemo(() => {
    return Array.from(new Set(books.map((book) => book.publicationYear))).sort(
      (a, b) => b - a,
    );
  }, [books]);

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      return await deleteBook(bookId, userId);
    },
    onSuccess: (deletedBookId: string) => {
      queryClient.setQueryData(
        ["books", userId, sorting],
        (old: Book[] | undefined) =>
          old ? old.filter((book) => book.id !== deletedBookId) : [],
      );

      toast({
        title: "Book deleted",
        description: "The book has been successfully deleted",
      });

      setDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: "Error deleting book",
        description: errorMessage,
      });
    },
  });

  const handleDelete = (book: Book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      if (bookToDelete.id === "bulk") {
        selectedBooks.forEach((bookId) => {
          deleteMutation.mutate(bookId);
        });
        setSelectedBooks([]);
        setSelectionMode(false);
      } else {
        deleteMutation.mutate(bookToDelete.id);
      }
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedBooks([]);
  };

  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId],
    );
  };

  const selectAllBooks = () => {
    if (selectedBooks.length === filteredBooks.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(filteredBooks.map((book) => book.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteDialogOpen(true);
    setBookToDelete({
      id: "bulk",
      title: `${selectedBooks.length} selected books`,
    } as Book);
  };

  const handleBulkExport = () => {
    setImportExportDialogOpen(true);
  };

  const handleSort = (column: string) => {
    setSorting((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (column: string) => {
    if (sorting.column !== column) return null;
    return sorting.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPublisherFilter("all");
    setYearFilter("all");
    setStatusFilter("all");
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.description &&
          book.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === "all" || book.category === categoryFilter;
      const matchesPublisher =
        publisherFilter === "all" || book.publisher === publisherFilter;
      const matchesYear =
        yearFilter === "all" || book.publicationYear.toString() === yearFilter;
      const matchesStatus =
        statusFilter === "all" || book.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPublisher &&
        matchesYear &&
        matchesStatus
      );
    });
  }, [
    books,
    searchQuery,
    categoryFilter,
    publisherFilter,
    yearFilter,
    statusFilter,
  ]);

  const handleBookFormSuccess = () => {
    setBookFormDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["books", userId] });
    toast({
      title: "Success",
      description: "Book has been saved successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Please sign in to view your books.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold">Manage Books</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <Button
            variant={selectionMode ? "default" : "outline"}
            onClick={toggleSelectionMode}
            size="sm"
            className="whitespace-nowrap"
          >
            {selectionMode ? "Cancel" : "Select"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setImportExportDialogOpen(true)}
            size="sm"
            className="whitespace-nowrap"
          >
            <Database className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Import/Export</span>
            <span className="sm:hidden">I/E</span>
          </Button>

          <Button
            onClick={() => setBookFormDialogOpen(true)}
            size="sm"
            className="whitespace-nowrap"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Book</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, author, ISBN, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {bookCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={publisherFilter} onValueChange={setPublisherFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Publisher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Publishers</SelectItem>
              {uniquePublishers.map((publisher) => (
                <SelectItem key={publisher} value={publisher}>
                  {publisher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {bookStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
              disabled={
                !searchQuery &&
                categoryFilter === "all" &&
                publisherFilter === "all" &&
                yearFilter === "all" &&
                statusFilter === "all"
              }
            >
              Clear Filters
            </Button>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) =>
                value && setViewMode(value as "list" | "grid")
              }
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {selectionMode && selectedBooks.length > 0 && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedBooks.length} items selected
          </span>
          <div className="flex-1"></div>
          <button
            onClick={handleBulkExport}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium bg-black text-white s rounded-md shadow-sm hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <CircleArrowUp className="h-4 w-4 mr-1.5" />
            Export Selected
          </button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
          </Button>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {selectionMode && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedBooks.length === filteredBooks.length &&
                        filteredBooks.length > 0
                      }
                      onCheckedChange={selectAllBooks}
                    />
                  </TableHead>
                )}
                <TableHead className="w-10">Cover</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("title")}
                >
                  Title
                </TableHead>
                <TableHead
                  className="cursor-pointer hidden md:table-cell"
                  onClick={() => handleSort("author")}
                >
                  Author {getSortIcon("author")}
                </TableHead>
                <TableHead className="hidden lg:table-cell">ISBN</TableHead>
                <TableHead
                  className="cursor-pointer hidden md:table-cell"
                  onClick={() => handleSort("category")}
                >
                  Category {getSortIcon("category")}
                </TableHead>
                {userRole !== "library" && (
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("price")}
                  >
                    Price {getSortIcon("price")}
                  </TableHead>
                )}
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("stock")}
                >
                  Stock {getSortIcon("stock")}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      selectionMode
                        ? userRole === "library"
                          ? 8
                          : 9
                        : userRole === "library"
                          ? 7
                          : 8
                    }
                    className="text-center py-10"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-2">No books found</p>
                      <Button
                        variant="link"
                        onClick={clearFilters}
                        className={
                          searchQuery ||
                          categoryFilter !== "all" ||
                          publisherFilter !== "all" ||
                          yearFilter !== "all" ||
                          statusFilter !== "all"
                            ? ""
                            : "hidden"
                        }
                      >
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    {selectionMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedBooks.includes(book.id)}
                          onCheckedChange={() => toggleBookSelection(book.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="h-12 w-9 overflow-hidden rounded-sm">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {book.title.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{book.title}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        {book.author}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {book.author}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {book.isbn}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {book.category}
                    </TableCell>
                    {userRole !== "library" && (
                      <TableCell>${book.price.toFixed(2)}</TableCell>
                    )}
                    <TableCell>{book.stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/book/${book.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/books/edit/${book.id}`)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(book)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2">No books found</p>
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className={
                    searchQuery ||
                    categoryFilter !== "all" ||
                    publisherFilter !== "all" ||
                    yearFilter !== "all" ||
                    statusFilter !== "all"
                      ? ""
                      : "hidden"
                  }
                >
                  Clear filters
                </Button>
              </div>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <Card
                key={book.id}
                className="overflow-hidden h-[300px] relative group"
              >
                {selectionMode && (
                  <div
                    className="absolute top-2 left-2 z-20 cursor-pointer"
                    onClick={() => toggleBookSelection(book.id)}
                  >
                    {selectedBooks.includes(book.id) ? (
                      <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center border-2 border-white shadow-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-black/60 rounded-md flex items-center justify-center border-2 border-white shadow-md hover:bg-black/80"></div>
                    )}
                  </div>
                )}

                <div className="h-full w-full relative">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="object-fit w-full h-full group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {book.title.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 rounded-t-md bg-black/70 p-3 text-white">
                    <h3 className="font-medium text-sm line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-200 line-clamp-1">
                      {book.author}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          book.stock <= 0
                            ? "bg-red-500/80 text-white"
                            : book.stock < 5
                              ? "bg-yellow-500/80 text-white"
                              : "bg-green-500/80 text-white"
                        }`}
                      >
                        {book.stock} in stock
                      </span>
                    </div>

                    <div className="flex items-center justify-start gap-1 mt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/book/${book.id}`)}
                        className="h-7 bg-gray-800 hover:bg-gray-700 rounded-md px-2 py-0 text-xs border-none"
                      >
                        <Eye className="h-3.5 w-3.5 text-white mr-1" />
                        <span className="text-white">View</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/books/edit/${book.id}`)}
                        className="h-7 bg-gray-800 hover:bg-gray-700 rounded-md px-2 py-0 text-xs border-none"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-white mr-1" />
                        <span className="text-white">Edit</span>
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => handleDelete(book)}
                        className="h-7 w-7 bg-gray-800 hover:bg-red-900 rounded-md p-0 border-none"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {bookToDelete?.id === "bulk"
                ? `${selectedBooks.length} selected books`
                : `"${bookToDelete?.title}"`}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importExportDialogOpen}
        onOpenChange={setImportExportDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Import/Export Books</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="import" className="mt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="import">
                <CircleArrowDown className="mr-2 h-4 w-4" /> Import Books
              </TabsTrigger>
              <TabsTrigger value="export">
                <CircleArrowUp className="mr-2 h-4 w-4" /> Export Books
              </TabsTrigger>
            </TabsList>
            <TabsContent value="import">
              <BulkBookImport />
            </TabsContent>
            <TabsContent value="export">
              <BulkBookExport
                selectedBooks={selectionMode ? selectedBooks : undefined}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={bookFormDialogOpen} onOpenChange={setBookFormDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
          </DialogHeader>
          <BookForm
            book={null}
            onSuccess={handleBookFormSuccess}
            onCancel={() => setBookFormDialogOpen(false)}
            userRole={userRole}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
