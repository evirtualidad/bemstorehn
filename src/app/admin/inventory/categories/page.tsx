
import { CategoriesManager } from "./categories-manager";

export default function CategoriesPage() {
    // This page component is now just a wrapper.
    // The actual UI and logic is in CategoriesManager to be used in tabs.
    return <CategoriesManager />;
}
