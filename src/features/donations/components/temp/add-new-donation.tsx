import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import AddDonationForm, { DonationFormData } from "./add-donation-form";

export function AddNewDonation() {
  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Simulate fetching facilities
        // const facilitiesRes = await fetch('/api/facilities');
        // setFacilities(await facilitiesRes.json());

        // Simulate fetching categories
        // const categoriesRes = await fetch('/api/categories');
        // setCategories(await categoriesRes.json());

        // Simulate fetching products
        // const productsRes = await fetch('/api/products');
        // setProducts(await productsRes.json());

        console.log("Data loaded:", { facilities, categories, products });
      } catch (error) {
        Alert.alert("Error", "Failed to load form data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: DonationFormData) => {
    // Submit logic
    console.log("Submitting:", data);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AddDonationForm onSubmit={handleSubmit} />;
}
