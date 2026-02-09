import AdminLayout from "@/layout/AdminLayout";
import { AdminClientManager } from "@/components/admin/AdminClientManager";
import { AdminClientCreator } from "@/components/admin/AdminClientCreator";

const AdminClients = () => (
  <AdminLayout
    title="Client Management"
    description="Create, manage, and sync client records with Dr. Green DApp"
  >
    <div className="space-y-8">
      <AdminClientCreator />
      <AdminClientManager />
    </div>
  </AdminLayout>
);

export default AdminClients;
