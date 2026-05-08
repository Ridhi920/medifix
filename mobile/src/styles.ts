import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    alignSelf: "center",
  },
  homeCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    flex: 1,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },
  homeScroll: {
    flexGrow: 1,
    paddingBottom: 24
  },
  serviceScreenCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "transparent",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    flex: 1,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },
  serviceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 16
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center"
  },
  backIcon: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#1e3a8a",
    transform: [{ rotate: "45deg" }]
  },
  serviceHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a"
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b"
  },
  serviceDescription: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 12,
    lineHeight: 20
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  headerGreeting: {
    fontSize: 14,
    color: "#64748b"
  },
  headerName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a"
  },
  menuWrapper: {
    position: "relative",
    alignItems: "flex-end"
  },
  hamburgerButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f8fafc"
  },
  hamburgerLine: {
    width: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#0f172a"
  },
  menuDropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 140,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 10
  },
  menuItem: {
    fontSize: 14,
    color: "#0f172a",
    paddingVertical: 8
  },
  searchBar: {
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  searchPlaceholder: {
    color: "#94a3b8",
    fontSize: 14
  },
  searchIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#cbd5f5"
  },
  bannerCard: {
    backgroundColor: "#FF6B35",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  bannerTextBlock: {
    flex: 1,
    marginRight: 12
  },
  bannerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6
  },
  bannerSubtitle: {
    color: "#FFE8DD",
    fontSize: 12,
    marginBottom: 10
  },
  bannerButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start"
  },
  bannerButtonText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 12
  },
  bannerBadge: {
    backgroundColor: "#FFE8DD",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  bannerBadgeText: {
    color: "#E85A28",
    fontWeight: "700",
    fontSize: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12
  },
  servicesRow: {
    gap: 12,
    paddingBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  servicePill: {
    backgroundColor: "#eef2ff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbeafe",
    width: "48%",
    minHeight: 72,
    justifyContent: "center"
  },
  serviceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b"
  },
  sectionLink: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600"
  },
  serviceListCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12
  },
  serviceListTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a"
  },
  serviceListSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  quickText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a"
  },
  promoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12
  },
  promoCardDark: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16
  },
  promoCardAccent: {
    flex: 1,
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    padding: 16
  },
  promoTitle: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 6
  },
  promoSubtitle: {
    color: "#FFE8DD",
    fontSize: 12
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 4
  },
  navIcon: {
    fontSize: 22
  },
  navLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500"
  },
  heroBlock: {
    alignItems: "center",
    marginBottom: 16
  },
  heroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 12,
    backgroundColor: "#f8fafc"
  },
  linkText: {
    fontSize: 12,
    color: "#FF6B35",
    textAlign: "right",
    marginBottom: 16,
    fontWeight: "600"
  },
  helperText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16
  },
  primaryButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4
  },
  switchText: {
    fontSize: 12,
    color: "#64748b"
  },
  switchLink: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "700"
  },
  // New Home Screen Styles
  newHeader: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  logoPlus: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700"
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a"
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  heroSection: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    lineHeight: 34
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#FFE8DD",
    marginBottom: 20,
    lineHeight: 20
  },
  heroButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-start"
  },
  heroButtonText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 14
  },
  heroImageContainer: {
    width: 140,
    alignItems: "center",
    justifyContent: "center"
  },
  heroImage: {
    width: "100%",
    height: "100%"
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 16,
    backgroundColor: "transparent"
  },
  serviceCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  serviceCardIcon: {
    width: 48,
    height: 48,
    marginBottom: 12
  },
  serviceCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 18
  },
  emergencyBanner: {
    backgroundColor: "#FF6B35",
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    marginRight: 12
  },
  callNowButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20
  },
  callNowText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 13
  },
  whySection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#ffffff"
  },
  whySectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 24
  },
  whyGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  whyCard: {
    alignItems: "center",
    width: "30%"
  },
  whyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  whyCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    lineHeight: 16
  },
  testimonialSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "transparent"
  },
  testimonialTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 20
  },
  testimonialCard: {
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16
  },
  testimonialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#93c5fd",
    alignItems: "center",
    justifyContent: "center"
  },
  testimonialQuote: {
    fontSize: 13,
    color: "#1e3a8a",
    fontStyle: "italic",
    lineHeight: 18
  },
  testimonialDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cbd5e1"
  },
  activeDot: {
    backgroundColor: "#FF6B35"
  }
});
