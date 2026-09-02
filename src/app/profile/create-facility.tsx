import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { FacilityType, FACILITY_TYPES } from "@/features/profile/types/profile.types";
import LocationPicker from "@/shared/components/location-picker";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

export default function CreateFacilityScreen() {
  const { colors } = useTheme();
  const user = useProfileStore((state) => state.user);
  const submitFacilityCreationRequest = useProfileStore(
    (state) => state.submitFacilityCreationRequest,
  );
  const isVerified = user.kyc.status === "verified";

  const [name, setName] = useState("");
  const [type, setType] = useState<FacilityType>("Retail Pharmacy");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [region, setRegion] = useState("");
  const referenceRegions = useReferenceDataStore((state) => state.regions);
  const regionOptions = useMemo(
    () => referenceRegions.map((r) => ({ id: r.name, label: r.name })),
    [referenceRegions],
  );
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !location.trim() || !region.trim()) {
      Alert.alert("Missing information", "Name, location, and region are required.");
      return;
    }
    setSubmitting(true);
    const result = await submitFacilityCreationRequest({
      name,
      type,
      location,
      region,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      registrationNumber: registrationNumber || undefined,
      latitude,
      longitude,
    });
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert("Couldn't submit request", result.error ?? "Something went wrong.");
      return;
    }
    toast.success("Request submitted — an admin will review it.");
    router.back();
  };

  if (!isVerified) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View
          className="flex-row items-center gap-3 px-4 py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          )}
          <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
            Create Facility
          </Text>
        </View>
        <View className="flex-1 items-center justify-center p-8">
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={32}
            color={colors.warning}
          />
          <Text
            className="text-[17px] font-bold mt-3.5 mb-2"
            style={{ color: colors.text }}
          >
            Verification required
          </Text>
          <Text
            className="text-[13px] text-center leading-5"
            style={{ color: colors.textSecondary }}
          >
            Your account needs to be verified before you can request a new facility.
            Submit your KYC documents from your profile to get started.
          </Text>
          <Pressable
            onPress={() => router.push("/profile/user-profile")}
            className="rounded-[10px] py-3.5 items-center mt-5 px-6"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white text-[15px] font-bold">Go to My Profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center gap-3 px-4 py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          )}
          <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
            Create Facility
          </Text>
        </View>

        <ScrollView
          contentContainerClassName="p-5"
          keyboardShouldPersistTaps="handled"
        >
          {/* Notice */}
          <View
            className="flex-row items-start gap-2 rounded-[10px] p-3 mb-[18px]"
            style={{ backgroundColor: colors.primary + "12" }}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.primary}
            />
            <Text
              className="text-xs flex-1 leading-[17px]"
              style={{ color: colors.primary }}
            >
              An admin reviews every new facility before it's created. Once approved,
              you'll be its Owner and can submit KYC documents to get it verified.
            </Text>
          </View>

          {/* Facility Name */}
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>
            Facility Name <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Adenta Community Pharmacy"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          {/* Type chips */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Type
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-1.5">
            {FACILITY_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                className="px-3 py-2 rounded-full border"
                style={{
                  borderColor: colors.border,
                  backgroundColor:
                    type === t ? colors.primary : colors.backgroundElement,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: type === t ? "#fff" : colors.text }}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Location */}
          <View className="mt-3.5">
            <LocationPicker
              label="Location"
              required
              value={location}
              onChangeText={setLocation}
              latitude={latitude}
              longitude={longitude}
              onLocationCaptured={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              onLocationCleared={() => {
                setLatitude(undefined);
                setLongitude(undefined);
              }}
              placeholder="Adenta, Accra"
            />
          </View>

          {/* Region */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Region <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <ReferencePicker
            title="Select Region"
            options={regionOptions}
            value={region}
            onChange={setRegion}
            placeholder="Select a region"
            emptyMessage="No regions set up yet."
            searchable={false}
          />

          {/* Address */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Address
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          {/* Phone */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Phone
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="024xxxxxxx"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          {/* Email */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="facility@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          {/* Registration Number */}
          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Registration Number
          </Text>
          <TextInput
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="Business registration number"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              color: colors.text,
            }}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="rounded-[10px] py-3.5 items-center mt-6"
            style={{
              backgroundColor: colors.primary,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-[15px] font-bold">Submit for Review</Text>
            )}
          </Pressable>

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}