// noinspection ExceptionCaughtLocallyJS

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Book, BookCategory, BookStatus } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookFormProps {
  book?: Book | null;
  onSuccess: () => void;
  onCancel: () => void;
  userRole?: string;
}

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

const BookForm = ({
  book,
  onSuccess,
  onCancel,
  userRole = "bookstore",
}: BookFormProps) => {
  const [formData, setFormData] = useState({
    title: book?.title || "",
    author: book?.author || "",
    isbn: book?.isbn || "",
    category: book?.category || ("Fiction" as BookCategory),
    description: book?.description || "",
    publisher: book?.publisher || "",
    publicationYear: book?.publicationYear?.toString() || "",
    price: book?.price?.toString() || "0.00",
    stock: book?.stock?.toString() || "0",
    status: book?.status || ("Available" as BookStatus),
    coverImage: book?.coverImage || "",
    location: book?.location || "",
    language: book?.language || "",
    pageCount: book?.pageCount?.toString() || "",
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!book;

  useEffect(() => {
    if (userRole === "library") {
      setFormData((current) => ({
        ...current,
        price: "0.00",
      }));
    }
  }, [userRole]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;

    if (id === "price" && userRole === "library") {
      return;
    }

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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Authentication error:", userError);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please sign in again to continue.",
        });
        setLoading(false);
        return;
      }

      if (!user) {
        console.error("No authenticated user found");
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "You must be logged in to perform this action.",
        });
        setLoading(false);
        return;
      }

      if (
        !formData.title ||
        !formData.author ||
        !formData.isbn ||
        !formData.publisher ||
        !formData.publicationYear
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
        price: userRole === "library" ? 0 : parseFloat(formData.price || "0"),
        stock: parseInt(formData.stock),
        status: formData.status,
        cover_image: formData.coverImage,
        location: formData.location,
        language: formData.language,
        page_count: formData.pageCount ? parseInt(formData.pageCount) : null,
        user_id: user.id,
      };

      if (isEditing && book) {
        const { error } = await supabase
          .from("books")
          .update(bookData)
          .eq("id", book.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }

        toast({
          title: "Book updated",
          description: `${formData.title} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from("books").insert([bookData]);

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }

        toast({
          title: "Book added",
          description: `${formData.title} has been added to your library.`,
        });
      }

      setLoading(false);

      setTimeout(() => {
        onSuccess();
      }, 10);
    } catch (error: unknown) {
      console.error("Form submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: isEditing ? "Failed to update book" : "Failed to add book",
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  const safeCancel = () => {
    setLoading(false);

    setTimeout(() => {
      onCancel();
    }, 10);
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2 sm:pr-4 -mr-2 sm:-mr-4 rounded-lg">
      <div className="px-1 sm:px-4 py-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onValueChange={(value) => handleSelectChange("category", value)}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="price"
                className={
                  userRole === "library" ? "text-muted-foreground" : ""
                }
              >
                {userRole === "library" ? "Price (Not Applicable)" : "Price *"}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                disabled={userRole === "library"}
                className={
                  userRole === "library"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : ""
                }
              />
              {userRole === "library" && (
                <p className="text-xs text-muted-foreground">
                  Not applicable for libraries
                </p>
              )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="location">Bookshelf Location</Label>
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
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                <div className="w-24 h-36 overflow-hidden border rounded-sm">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://placehold.co/240x360/e2e8f0/64748b?text=No+Image";
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-6 pb-4 mt-8 px-2">
              <Button
                type="button"
                variant="outline"
                onClick={safeCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? isEditing
                    ? "Updating..."
                    : "Adding..."
                  : isEditing
                    ? "Update Book"
                    : "Add Book"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookForm;
