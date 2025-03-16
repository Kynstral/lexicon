export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          author: string;
          category: string;
          cover_image: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          isbn: string;
          language: string | null;
          location: string | null;
          page_count: number | null;
          price: number;
          publication_year: number;
          publisher: string;
          rating: number | null;
          sales_count: number;
          status: string;
          stock: number;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          author: string;
          category: string;
          cover_image?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          isbn: string;
          language?: string | null;
          location?: string | null;
          page_count?: number | null;
          price: number;
          publication_year: number;
          publisher: string;
          rating?: number | null;
          sales_count?: number;
          status: string;
          stock?: number;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          author?: string;
          category?: string;
          cover_image?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          isbn?: string;
          language?: string | null;
          location?: string | null;
          page_count?: number | null;
          price?: number;
          publication_year?: number;
          publisher?: string;
          rating?: number | null;
          sales_count?: number;
          status?: string;
          stock?: number;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      borrowings: {
        Row: {
          book_id: string | null;
          checkout_date: string | null;
          condition_on_return: string | null;
          created_at: string | null;
          due_date: string;
          id: string;
          member_id: string | null;
          notes: string | null;
          return_date: string | null;
          status: string;
          user_id: string | null;
          reminder_sent: boolean | null;
          reminder_date: string | null;
        };
        Insert: {
          book_id?: string | null;
          checkout_date?: string | null;
          condition_on_return?: string | null;
          created_at?: string | null;
          due_date: string;
          id?: string;
          member_id?: string | null;
          notes?: string | null;
          return_date?: string | null;
          status?: string;
          user_id?: string | null;
          reminder_sent: boolean | null;
          reminder_date: string | null;
        };
        Update: {
          book_id?: string | null;
          checkout_date?: string | null;
          condition_on_return?: string | null;
          created_at?: string | null;
          due_date?: string;
          id?: string;
          member_id?: string | null;
          notes?: string | null;
          return_date?: string | null;
          status?: string;
          user_id?: string | null;
          reminder_sent: boolean | null;
          reminder_date: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "borrowings_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "borrowings_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      checkout_items: {
        Row: {
          book_id: string | null;
          created_at: string | null;
          id: string;
          price: number;
          quantity: number;
          title: string;
          transaction_id: string | null;
        };
        Insert: {
          book_id?: string | null;
          created_at?: string | null;
          id?: string;
          price: number;
          quantity: number;
          title: string;
          transaction_id?: string | null;
        };
        Update: {
          book_id?: string | null;
          created_at?: string | null;
          id?: string;
          price?: number;
          quantity?: number;
          title?: string;
          transaction_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "checkout_items_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkout_items_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "checkout_transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      checkout_transactions: {
        Row: {
          created_at: string | null;
          customer_id: string | null;
          date: string | null;
          id: string;
          payment_method: string | null;
          return_date: string | null;
          status: string;
          total_amount: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id?: string | null;
          date?: string | null;
          id?: string;
          payment_method?: string | null;
          return_date?: string | null;
          status: string;
          total_amount: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string | null;
          date?: string | null;
          id?: string;
          payment_method?: string | null;
          return_date?: string | null;
          status?: string;
          total_amount?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      members: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string;
          id: string;
          joined_date: string | null;
          name: string;
          phone: string | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          joined_date?: string | null;
          name: string;
          phone?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          joined_date?: string | null;
          name?: string;
          phone?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
