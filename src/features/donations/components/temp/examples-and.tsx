// import React, { useState } from 'react';
// import { Alert, ActivityIndicator, View } from 'react-native';
// // import AddNewDonation, { DonationFormData } from '@/features/donations/components/temp/examples-and';



// export function EditDonationExample() {
//   const [isLoading, setIsLoading] = useState(false);
  
//   // Pre-filled data from backend
//   const existingDonation: Partial<DonationFormData> = {
//     facility: 'facility_1',
//     categories: ['cat_1', 'cat_3'],
//     termsOfService: 'All donations must meet quality standards...',
//     comment: 'High-priority donation from corporate partner',
//     isActive: true,
//     status: 'opened',
//     donatedItems: [
//       {
//         id: 'item_1',
//         product: 'Paracetamol 500mg',
//         quantity: 100,
//         batch: 'BATCH-2024-001',
//         expiryDate: '2025-12-31',
//         status: true,
//         isActive: true,
//       },
//       {
//         id: 'item_2',
//         product: 'Surgical Gloves',
//         quantity: 500,
//         batch: 'BATCH-2024-002',
//         expiryDate: '2026-06-30',
//         status: true,
//         isActive: true,
//       },
//     ],
//   };

//   const handleSubmit = async (data: DonationFormData) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch('https://api.example.com/donations/123', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update donation');
//       }

//       Alert.alert('Success', 'Donation updated successfully!');
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <AddNewDonation
//       onSubmit={handleSubmit}
//       initialData={existingDonation}
//       isLoading={isLoading}
//     />
//   );
// }
