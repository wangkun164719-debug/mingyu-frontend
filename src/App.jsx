import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AboutPage from "./pages/AboutPage";
import DetailReportPage from "./pages/DetailReportPage";
import FAQPage from "./pages/FAQPage";
import HomePage from "./pages/HomePage";
import InfoFormPage from "./pages/InfoFormPage";
import SimpleResultPage from "./pages/SimpleResultPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/measure" element={<InfoFormPage />} />
        <Route path="/result" element={<SimpleResultPage />} />
        <Route path="/report" element={<DetailReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
