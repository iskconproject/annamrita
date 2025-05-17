import { useEffect, useState } from "react";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MenuItem } from "@/types/menu";
import { Category } from "@/types/category";
import { menuItemSchema, MenuItemFormValues } from "@/schemas/menu-schema";

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem;
  categories: Category[];
  onSubmit: (item: Omit<MenuItem, "id">) => void;
}

export function MenuItemDialog({ open, onOpenChange, item, categories, onSubmit }: MenuItemDialogProps) {
  const [newCategory, setNewCategory] = useState("");
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema) as any,
    defaultValues: {
      name: "",
      shortName: "",
      category: "",
      price: 0,
      available: true,
    },
  }) as UseFormReturn<MenuItemFormValues>;

  // Reset form when dialog opens/closes or when editing a different item
  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          shortName: item.shortName,
          category: item.category,
          price: item.price,
          available: item.available,
        });
      } else {
        form.reset({
          name: "",
          shortName: "",
          category: "",
          price: 0,
          available: true,
        });
      }
      // Reset the new category state
      setNewCategory("");
    }
  }, [open, item, form]);

  const handleSubmit: SubmitHandler<MenuItemFormValues> = (values) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-iskcon-primary">
            {item ? "Edit Menu Item" : "Add New Menu Item"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name (for receipt)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter short name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value === "new-category") {
                            // If "Add New Category" is selected, show the input field
                            setNewCategory("");
                          } else {
                            field.onChange(value);
                            setNewCategory("");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 ? (
                            <>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="new-category" className="text-iskcon-primary font-medium border-t mt-1 pt-1">
                                + Add New Category
                              </SelectItem>
                            </>
                          ) : (
                            <div className="p-2 text-center text-sm text-gray-500">
                              No categories found. Add a new one.
                              <SelectItem value="new-category" className="text-iskcon-primary font-medium mt-1">
                                + Add New Category
                              </SelectItem>
                            </div>
                          )}
                        </SelectContent>
                      </Select>

                      {/* Show input field when "Add New Category" is selected */}
                      {field.value === "new-category" && (
                        <div className="mt-2">
                          <Input
                            id="new-category-input"
                            placeholder="Enter new category name"
                            value={newCategory}
                            onChange={(e) => {
                              const value = e.target.value;
                              setNewCategory(value);
                              if (value.trim()) {
                                field.onChange(value);
                              }
                            }}
                            className="focus:ring-2 focus:ring-iskcon-primary focus:border-iskcon-primary"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Available</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-iskcon-primary hover:bg-iskcon-primary/90">
                {item ? "Update" : "Add"} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
