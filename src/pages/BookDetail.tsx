import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  BookText,
  Building,
  Calendar,
  Languages,
  Library,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BookCard from "@/components/BookCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Book, BookCategory, BookStatus } from "@/lib/types";
import { getRelatedBooks } from "@/lib/data";
import { useAuth } from "@/components/AuthStatusProvider";
import { useCart } from "@/hooks/use-cart";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const { userRole } = useAuth();
  const { addToCart, cart } = useCart();

  const isLibraryRole = userRole === "Library";

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching book:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load book details.",
          });
          return;
        }

        if (data) {
          const formattedBook: Book = {
            id: data.id,
            title: data.title,
            author: data.author,
            isbn: data.isbn,
            category: data.category as BookCategory,
            publicationYear: data.publication_year,
            publisher: data.publisher,
            description: data.description || "",
            price: data.price,
            status: data.status as BookStatus,
            coverImage: data.cover_image || "",
            stock: data.stock,
            location: data.location || "",
            rating: data.rating,
            pageCount: data.page_count,
            language: data.language || "English",
            tags: data.tags || [],
            salesCount: 0,
          };

          setBook(formattedBook);

          const { data: relatedData, error: relatedError } = await supabase
            .from("books")
            .select("*")
            .eq("category", formattedBook.category)
            .neq("id", id)
            .limit(4);

          if (!relatedError && relatedData) {
            const formattedRelated = relatedData.map((item) => ({
              id: item.id,
              title: item.title,
              author: item.author,
              isbn: item.isbn,
              category: item.category as BookCategory,
              publicationYear: item.publication_year,
              publisher: item.publisher,
              description: item.description || "",
              price: item.price,
              status: item.status as BookStatus,
              coverImage: item.cover_image || "",
              stock: item.stock,
              location: item.location || "",
              rating: item.rating,
              pageCount: item.page_count,
              language: item.language || "English",
              tags: item.tags || [],
              salesCount: item.sales_count || 0,
            }));
            setRelatedBooks(formattedRelated);
          } else {
            setRelatedBooks(getRelatedBooks(formattedBook));
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="relative">
          <BookOpen className="h-16 w-16 text-primary/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary/70 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium">
          Loading book details...
        </p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-center max-w-md">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Book not found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the book you're looking for. It may have been
            removed or the link might be incorrect.
          </p>
          <Button onClick={() => navigate("/catalog")} size="lg">
            Browse Catalog
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      bookId: book.id,
      title: book.title,
      price: book.price,
      quantity: quantity,
      coverImage: book.coverImage,
    });

    toast({
      title: "Added to cart",
      description: `${quantity} copies of "${book.title}" have been added to your cart.`,
    });
  };

  const handleBorrowBook = () => {
    navigate("/book-circulation", {
      state: {
        bookId: book.id,
        bookTitle: book.title,
        bookCover: book.coverImage,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <main className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <Button variant="ghost" size="sm" asChild className="pl-0">
            <Link to="/catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Catalog
            </Link>
          </Button>

          {!isLibraryRole && cartItemCount > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/checkout" className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Cart
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-full h-5 px-2"
                >
                  {cartItemCount}
                </Badge>
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-fade-in">
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg bg-gradient-to-b from-muted/30 to-muted border border-border/50">
              <img
                src={book.coverImage || "/placeholder.svg"}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>

            <div className="mt-6 space-y-4 lg:hidden">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  {book.category}
                </Badge>
                <Badge
                  variant={
                    book.status === "Available" ? "default" : "secondary"
                  }
                  className="px-3 py-1"
                >
                  {book.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {book.title}
              </h1>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  by {book.author}
                </p>
              </div>

              {book.rating && (
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(book.rating || 0)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {book.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="hidden lg:block">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="px-3 py-1">
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  {book.category}
                </Badge>
                <Badge
                  variant={
                    book.status === "Available" ? "default" : "secondary"
                  }
                  className="px-3 py-1"
                >
                  {book.status}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                {book.title}
              </h1>
              <div className="flex items-center mb-3">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">
                  by {book.author}
                </p>
              </div>

              {book.rating && (
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(book.rating || 0)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {book.rating}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/40 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">
                  Publication
                </p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary/70" />
                  <p className="font-medium">{book.publicationYear}</p>
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Language</p>
                <div className="flex items-center">
                  <Languages className="h-4 w-4 mr-2 text-primary/70" />
                  <p className="font-medium">{book.language}</p>
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Pages</p>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary/70" />
                  <p className="font-medium">{book.pageCount}</p>
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary/70" />
                  <p className="font-medium truncate">
                    {book.location || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border shadow-sm">
              <h3 className="font-semibold text-lg mb-3">About this book</h3>
              <p className="text-muted-foreground leading-relaxed">
                {book.description}
              </p>
            </div>

            {book.tags && book.tags.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card rounded-lg p-6 border shadow-sm">
              {isLibraryRole ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p
                        className={`text-lg font-medium ${book.status === "Available" ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-500"}`}
                      >
                        {book.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Inventory</p>
                      <p className="text-lg font-medium">
                        {book.stock > 0
                          ? `${book.stock} copies available`
                          : "Out of stock"}
                      </p>
                    </div>
                  </div>

                  {book.stock > 0 && (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBorrowBook}
                    >
                      <Library className="h-5 w-5 mr-2" />
                      Borrow Book
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-3xl font-bold">
                        ${book.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Availability
                      </p>
                      <p
                        className={`text-lg font-medium ${book.stock > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                      >
                        {book.stock > 0
                          ? `${book.stock} in stock`
                          : "Out of stock"}
                      </p>
                    </div>
                  </div>

                  {book.stock > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="rounded-r-none h-10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-12 text-center font-medium">
                          {quantity}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setQuantity(Math.min(book.stock, quantity + 1))
                          }
                          disabled={quantity >= book.stock}
                          className="rounded-l-none h-10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart
                      </Button>

                      {cartItemCount > 0 && (
                        <Button variant="outline" size="lg" asChild>
                          <Link to="/checkout">View Cart</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-8 mb-16 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-xl font-semibold">About the Author</h3>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0 flex items-center justify-center mt-1">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-2">{book.author}</h4>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {book.author} is the acclaimed author of {book.title}. Their
                    work spans multiple genres and has been recognized for its
                    depth and creativity.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/catalog?author=${encodeURIComponent(book.author)}`}
                    >
                      View all books by this author
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-4">
                <BookText className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-xl font-semibold">Publication Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Publisher
                  </p>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-primary/70" />
                    <p className="font-medium">{book.publisher}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    ISBN
                  </p>
                  <div className="flex items-center">
                    <Bookmark className="h-4 w-4 mr-2 text-primary/70" />
                    <p className="font-medium font-mono">{book.isbn}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Publication Year
                  </p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary/70" />
                    <p className="font-medium">{book.publicationYear}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Language
                  </p>
                  <div className="flex items-center">
                    <Languages className="h-4 w-4 mr-2 text-primary/70" />
                    <p className="font-medium">{book.language || "English"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Pages
                  </p>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary/70" />
                    <p className="font-medium">
                      {book.pageCount || "Not available"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Location
                  </p>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary/70" />
                    <p className="font-medium">
                      {book.location || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div className="mt-16 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Related Books</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/catalog?category=${book.category}`}>
                  View All
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <BookCard
                  key={relatedBook.id}
                  book={relatedBook}
                  onAddToCart={() => {
                    addToCart({
                      bookId: relatedBook.id,
                      title: relatedBook.title,
                      price: relatedBook.price,
                      quantity: 1,
                      coverImage: relatedBook.coverImage,
                    });

                    toast({
                      title: "Added to cart",
                      description: `"${relatedBook.title}" has been added to your cart.`,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookDetail;
