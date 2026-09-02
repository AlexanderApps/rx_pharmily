import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { formatAmount } from "@/shared/utils/format";

interface PriceComboBoxProps {
  value: string;
  onChange: (value: string) => void;

  /**
   * Facility whose price lists should be used.
   *
   * If undefined, the component behaves as a normal
   * decimal price input.
   */
  facilityId?: string;

  placeholder?: string;
  error?: string;
  currency?: string;
}

const PriceComboBox: React.FC<PriceComboBoxProps> = ({
  value,
  onChange,
  facilityId,
  placeholder = "Search products or enter price...",
  error,
  currency = "GHS",
}) => {
  const { colors } = useTheme();

  const priceTemplates = useProfileStore((state) => state.priceTemplates);

  const [focused, setFocused] = useState(false);

  /**
   * Selected price list.
   */
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  /**
   * Product selected from the price list.
   *
   * This is informational only.
   *
   * It does NOT lock the price input.
   */
  const [selectedProductName, setSelectedProductName] = useState<string | null>(
    null,
  );

  /**
   * Text used when searching products.
   *
   * This is intentionally separate from `value`,
   * because `value` is always the actual price.
   */
  const [productQuery, setProductQuery] = useState("");

  // ============================================================
  // FACILITY PRICE LISTS
  // ============================================================

  const facilityPriceLists = useMemo(() => {
    if (!facilityId) {
      return [];
    }

    return priceTemplates.filter(
      (template) => template.facilityId === facilityId,
    );
  }, [priceTemplates, facilityId]);

  const hasPriceLists = facilityPriceLists.length > 0;

  // ============================================================
  // SELECTED PRICE LIST
  // ============================================================

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) {
      return null;
    }

    return (
      facilityPriceLists.find(
        (template) => template.id === selectedTemplateId,
      ) ?? null
    );
  }, [facilityPriceLists, selectedTemplateId]);

  // ============================================================
  // FACILITY CHANGE
  // ============================================================

  useEffect(() => {
    if (
      selectedTemplateId &&
      !facilityPriceLists.some((template) => template.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(null);
      setSelectedProductName(null);
      setProductQuery("");
    }
  }, [facilityPriceLists, selectedTemplateId]);

  // ============================================================
  // SELECTED PRICE LIST ITEMS
  // ============================================================

  const items = useMemo(() => {
    return selectedTemplate?.items ?? [];
  }, [selectedTemplate]);

  // ============================================================
  // PRODUCT SEARCH
  // ============================================================

  const suggestions = useMemo(() => {
    if (!selectedTemplate) {
      return [];
    }

    const query = productQuery.trim().toLowerCase();

    if (!query) {
      return items.slice(0, 6);
    }

    return items
      .filter((item) => item.product.toLowerCase().includes(query))
      .slice(0, 6);
  }, [items, selectedTemplate, productQuery]);

  // ============================================================
  // INPUT MODE
  // ============================================================

  /**
   * IMPORTANT:
   *
   * The user can enter a price at ANY time.
   *
   * Therefore the presence of a selected price list does
   * not automatically mean that the input is a search box.
   *
   * We determine the mode from what the user is typing.
   */
  const isNumericInput = (text: string) => {
    return /^[0-9.]*$/.test(text);
  };

  /**
   * The input is considered a product search when:
   *
   * - a price list exists
   * - a price list has been selected
   * - the user is entering non-numeric text
   *
   * Otherwise it behaves as a price input.
   */
   const isSearchMode =
     !!selectedTemplate &&
     productQuery.length > 0 &&
     !isNumericInput(productQuery);

  /**
   * What should currently be displayed in the TextInput?
   *
   * Search mode -> productQuery
   * Price mode  -> value
   */
  const inputValue = isSearchMode ? productQuery : value;

  /**
   * Use decimal-pad when entering a price.
   *
   * Use default keyboard when searching products.
   */
  const keyboardType = selectedTemplate ? "default" : "decimal-pad";

  // ============================================================
  // PRICE INPUT CLEANING
  // ============================================================

  const cleanPrice = (text: string) => {
    /**
     * Keep only numbers and decimal point.
     */
    const filtered = text.replace(/[^0-9.]/g, "");

    /**
     * Allow only one decimal point.
     */
    const firstDot = filtered.indexOf(".");

    if (firstDot === -1) {
      return filtered;
    }

    return (
      filtered.slice(0, firstDot + 1) +
      filtered.slice(firstDot + 1).replace(/\./g, "")
    );
  };

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChangeText = (text: string) => {
    /**
     * Empty input should always clear the price/search.
     */
    if (text.length === 0) {
      setProductQuery("");
      setSelectedProductName(null);
      onChange("");
      return;
    }

    /**
     * --------------------------------------------------------
     * NUMERIC INPUT
     * --------------------------------------------------------
     *
     * Numbers ALWAYS represent the price.
     *
     * This is important even when a price list is selected.
     *
     * Example:
     *
     *   price list selected
     *   user types "25"
     *
     * Result:
     *   value = "25"
     *
     * NOT:
     *   productQuery = "25"
     */
    if (isNumericInput(text)) {
      const price = cleanPrice(text);

      setProductQuery("");
      onChange(price);

      return;
    }

    /**
     * --------------------------------------------------------
     * TEXT INPUT
     * --------------------------------------------------------
     *
     * Text is a product search only if a price list
     * has been selected.
     */
    if (selectedTemplate) {
      setSelectedProductName(null);
      setProductQuery(text);
      return;
    }

    /**
     * No price list selected.
     *
     * Since this is a price field, ignore non-numeric
     * characters.
     */
    onChange(cleanPrice(text));
  };

  // ============================================================
  // PRICE LIST SELECTION
  // ============================================================

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);

    /**
     * Selecting a different price list invalidates
     * the previously selected product.
     */
    setSelectedProductName(null);
    setProductQuery("");

    /**
     * Do not force a price.
     *
     * The user can manually enter one immediately.
     */
    onChange("");

    setFocused(true);
  };

  // ============================================================
  // CHANGE PRICE LIST
  // ============================================================

  const handleChangeTemplate = () => {
    setSelectedTemplateId(null);
    setSelectedProductName(null);
    setProductQuery("");

    /**
     * Keep the manually entered price.
     *
     * This is important:
     *
     * User:
     *   selects product -> GHS 25
     *   edits price -> GHS 27
     *   changes price list
     *
     * We should not unexpectedly erase their manually
     * entered value.
     */
    setFocused(true);
  };

  // ============================================================
  // PRODUCT SELECTION
  // ============================================================

  const handleSelectProduct = (item: { product: string; rate: number }) => {
    setSelectedProductName(item.product);

    /**
     * Product selection supplies the initial price.
     *
     * The user can edit it immediately afterwards.
     */
    onChange(item.rate.toString());

    setProductQuery("");
    setFocused(false);
  };

  // ============================================================
  // CLEAR PRODUCT
  // ============================================================

  const handleClearProduct = () => {
    setSelectedProductName(null);
    setProductQuery("");

    /**
     * Do NOT clear the price.
     *
     * The user may have manually edited it.
     */
    setFocused(true);
  };

  // ============================================================
  // DROPDOWN VISIBILITY
  // ============================================================

  /**
   * Price list picker.
   */
  const showPriceListDropdown = focused && hasPriceLists && !selectedTemplate;

  /**
   * Product search dropdown.
   *
   * Only show it when the user is actually typing
   * non-numeric text.
   */
  const showProductDropdown = focused && isSearchMode && suggestions.length > 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View>
      {/* ======================================================
          INPUT
          ====================================================== */}

      <View
        className="flex-row items-center gap-2 border rounded-[10px] px-3 py-[11px]"
        style={{
          backgroundColor: colors.backgroundElement,

          borderColor: error
            ? colors.error
            : focused
              ? colors.primary
              : colors.border,
        }}
      >
        <MaterialCommunityIcons
          name={isSearchMode ? "text-box-search-outline" : "currency-usd"}
          size={16}
          color={colors.textSecondary}
        />

        <TextInput
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setFocused(false);
            }, 150);
          }}
          placeholder={isSearchMode ? placeholder : "0.00"}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          className="flex-1 text-sm p-0"
          style={{ color: colors.text }}
        />
      </View>

      {/* ======================================================
          PRICE LIST HINT
          ====================================================== */}

      {hasPriceLists && !selectedTemplate && !error && (
        <Text
          className="text-[11px] mt-[5px] leading-[15px]"
          style={{ color: colors.textSecondary }}
        >
          Select a price list to search products, or enter a price directly.
        </Text>
      )}

      {/* ======================================================
          SELECTED PRICE LIST
          ====================================================== */}

      {selectedTemplate && (
        <View className="mt-1.5">
          <Text
            className="text-[10px] mb-[3px]"
            style={{ color: colors.textSecondary }}
          >
            Price list
          </Text>

          <Pressable
            onPress={handleChangeTemplate}
            className="flex-row items-center gap-1.5 border rounded-lg px-[9px] py-[7px]"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={14}
              color={colors.primary}
            />

            <Text
              className="flex-1 text-[11px] font-semibold"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {selectedTemplate.title}
            </Text>

            <MaterialCommunityIcons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      )}

      {/* ======================================================
          SELECTED PRODUCT
          ====================================================== */}

      {selectedProductName && (
        <View className="mt-1.5">
          <Text
            className="text-[10px] mb-[3px]"
            style={{ color: colors.textSecondary }}
          >
            Product
          </Text>

          <Pressable
            onPress={handleClearProduct}
            className="flex-row items-center gap-1.5 border rounded-lg px-[9px] py-[7px]"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="pill"
              size={14}
              color={colors.primary}
            />

            <Text
              className="flex-1 text-[11px] font-semibold"
              style={{
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {selectedProductName}
            </Text>

            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      )}

      {/* ======================================================
          PRICE LIST DROPDOWN
          ====================================================== */}

      {showPriceListDropdown && (
        <View
          className="border rounded-[10px] mt-1.5 overflow-hidden"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-[10px] font-semibold px-3 pt-[9px] pb-1.5"
            style={{ color: colors.textSecondary }}
          >
            Select price list
          </Text>

          {facilityPriceLists.map((template) => (
            <Pressable
              key={template.id}
              onPressIn={() => handleSelectTemplate(template.id)}
              className="flex-row items-center gap-2.5 px-3 py-2.5"
              style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
            >
              <View className="w-7 h-7 items-center justify-center">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {template.title}
                </Text>

                <Text
                  className="text-[11px] mt-px"
                  style={{ color: colors.textSecondary }}
                >
                  {template.items.length}{" "}
                  {template.items.length === 1 ? "product" : "products"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* ======================================================
          PRODUCT SEARCH DROPDOWN
          ====================================================== */}

      {showProductDropdown && (
        <View
          className="border rounded-[10px] mt-1.5 overflow-hidden"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPressIn={() => handleSelectProduct(item)}
              className="flex-row items-center gap-2.5 px-3 py-2.5"
              style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {item.product}
                </Text>

                {item.unit && (
                  <Text
                    className="text-[11px] mt-px"
                    style={{ color: colors.textSecondary }}
                  >
                    Per {item.unit}
                  </Text>
                )}
              </View>

              <Text
                className="text-[13px] font-bold"
                style={{ color: colors.primary }}
              >
                {currency} {formatAmount(item.rate)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <Text
          className="text-[11px] mt-1"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default PriceComboBox;
