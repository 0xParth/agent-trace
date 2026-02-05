import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ToolRegistry } from '@/components/registry/ToolRegistry';
import { BlastRadius } from '@/components/blast-radius/BlastRadius';
import { CapabilityMatrix } from '@/components/matrix/CapabilityMatrix';
import { Overview } from '@/components/overview/Overview';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/tools" element={<ToolRegistry />} />
        <Route path="/blast-radius" element={<BlastRadius />} />
        <Route path="/matrix" element={<CapabilityMatrix />} />
      </Routes>
    </Layout>
  );
}

export default App;
