
import { ProductsManager } from './products-manager';

export default function ProductsPage() {
    // This page component is now just a wrapper.
    // The actual UI and logic is in ProductsManager to be used in tabs.
    return <ProductsManager />;
}
