import AdminLayout from "@/layout/AdminLayout";
import { ApiTestRunner } from "@/components/admin/ApiTestRunner";
import { ApiComparisonDashboard } from "@/components/admin/ApiComparisonDashboard";
import { ApiDebugPanel } from "@/components/admin/ApiDebugPanel";
import { BatchImageGenerator } from "@/components/admin/BatchImageGenerator";
import { AdminClientImport } from "@/components/admin/AdminClientImport";
import { AdminEmailTrigger } from "@/components/admin/AdminEmailTrigger";
import { KYCJourneyViewer } from "@/components/admin/KYCJourneyViewer";

const AdminTools = () => (
  <AdminLayout
    title="Developer Tools"
    description="API testing, debugging, and data import utilities"
  >
    <div className="space-y-8">
      <ApiTestRunner />
      <ApiComparisonDashboard />
      <ApiDebugPanel />
      <BatchImageGenerator />
      <KYCJourneyViewer />
      <AdminEmailTrigger />
      <AdminClientImport />
    </div>
  </AdminLayout>
);

export default AdminTools;
