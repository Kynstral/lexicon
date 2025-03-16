import { useState } from "react";
import { Link } from "react-router-dom";
import { Book as BookIcon, Info, Star } from "lucide-react";
import { Book } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BookCardProps {
  book: Book;
  onAddToCart?: (book: Book) => void;
  minimal?: boolean;
}

const BookCard = ({ book, onAddToCart, minimal = false }: BookCardProps) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAction = () => {
    if (onAddToCart) {
      onAddToCart(book);

      toast({
        title: "Book selected",
        description: `You selected ${book.title}`,
        duration: 2000,
      });
    }
  };

  return (
    <div
      className={`book-card relative bg-card rounded-lg overflow-hidden border transition-all ${
        minimal ? "h-full" : "h-full shadow-sm hover:shadow-md"
      }`}
    >
      {!minimal && (
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={book.status === "Available" ? "available" : "unavailable"}
          >
            {book.status}
          </Badge>
        </div>
      )}

      <div
        className={`${minimal ? "h-40" : "h-52"} relative overflow-hidden bg-muted`}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <BookIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <img
          src={book.coverImage || "/placeholder.svg"}
          alt={book.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
            setImageLoaded(true);
          }}
        />
      </div>

      <div className={`p-4 ${minimal ? "pt-3" : ""}`}>
        {!minimal && (
          <Badge variant="outline" className="mb-2 text-xs">
            {book.category}
          </Badge>
        )}

        <h3
          className={`font-medium line-clamp-1 ${minimal ? "text-sm" : "text-base"}`}
        >
          {book.title}
        </h3>
        <p
          className={`text-muted-foreground mb-2 ${minimal ? "text-xs" : "text-sm"}`}
        >
          {book.author}
        </p>

        {!minimal && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm">
              Stock: <span className="font-medium">{book.stock}</span>
            </p>
            {book.rating && (
              <div className="flex items-center text-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 mr-1" />
                <span>{book.rating}</span>
              </div>
            )}
          </div>
        )}

        {!minimal && (
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <Link to={`/book/${book.id}`}>
                <Info className="h-4 w-4 mr-1" />
                Details
              </Link>
            </Button>

            <Button
              size="sm"
              className="flex-1"
              disabled={book.stock === 0 || book.status !== "Available"}
              onClick={handleAction}
            >
              View
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
