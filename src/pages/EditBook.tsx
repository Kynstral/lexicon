// noinspection ExceptionCaughtLocallyJS

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookCategory, BookStatus } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, BookOpen, Loader2, Save } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

const EditBook = () => {
  const { id } = useParams<{ id: string }>();
  const isNewBook = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNewBook);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "Fiction" as BookCategory,
    description: "",
    publisher: "",
    publicationYear: "",
    price: "",
    stock: "0",
    status: "Available" as BookStatus,
    coverImage: "",
    location: "",
    language: "",
    pageCount: "",
  });

  useEffect(() => {
    const fetchBookData = async () => {
      if (isNewBook) {
        setInitialLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            title: data.title || "",
            author: data.author || "",
            isbn: data.isbn || "",
            category: data.category as BookCategory,
            description: data.description || "",
            publisher: data.publisher || "",
            publicationYear: data.publication_year?.toString() || "",
            price: data.price?.toString() || "",
            stock: data.stock?.toString() || "0",
            status: data.status as BookStatus,
            coverImage: data.cover_image || "",
            location: data.location || "",
            language: data.language || "",
            pageCount: data.page_count?.toString() || "",
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";

        toast({
          variant: "destructive",
          title: "Error loading book",
          description: errorMessage,
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBookData();
  }, [id, isNewBook, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      if (
        !formData.title ||
        !formData.author ||
        !formData.isbn ||
        !formData.publisher ||
        !formData.publicationYear ||
        !formData.price
      ) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please fill in all required fields.",
        });
        setLoading(false);
        return;
      }

      const bookData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        description: formData.description,
        publisher: formData.publisher,
        publication_year: parseInt(formData.publicationYear),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        status: formData.status,
        cover_image: formData.coverImage,
        location: formData.location,
        language: formData.language,
        page_count: formData.pageCount ? parseInt(formData.pageCount) : null,
      };

      if (!isNewBook) {
        const { error } = await supabase
          .from("books")
          .update(bookData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Book updated",
          description: `${formData.title} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from("books").insert([bookData]);

        if (error) throw error;

        toast({
          title: "Book added",
          description: `${formData.title} has been added to your library.`,
        });
      }

      navigate("/books");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: isNewBook ? "Failed to add book" : "Failed to update book",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading book details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/books">Books</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                {isNewBook ? "Add New Book" : "Edit Book"}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            {isNewBook ? "Add New Book" : "Edit Book Details"}
          </h2>
          <p className="text-muted-foreground">
            {isNewBook
              ? "Add a new book to your library inventory"
              : "Update the information for this book"}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/books")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Books
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
            <CardDescription>
              Enter the details of the book below. Fields marked with * are
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleSelectChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher *</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicationYear">Publication Year *</Label>
                <Input
                  id="publicationYear"
                  type="number"
                  value={formData.publicationYear}
                  onChange={handleChange}
                  required
                  min="1000"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageCount">Page Count</Label>
                <Input
                  id="pageCount"
                  type="number"
                  value={formData.pageCount}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookStatuses.map((stat) => (
                      <SelectItem key={stat} value={stat}>
                        {stat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location/Call Number</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="https://example.com/cover-image.jpg"
              />
              {formData.coverImage && (
                <div className="mt-2 border rounded-md p-2 w-24 h-36 overflow-hidden">
                  <img
                    src={formData.coverImage}
                    alt="Book cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/books")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isNewBook ? "Adding..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isNewBook ? "Add Book" : "Update Book"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditBook;
