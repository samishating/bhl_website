import LoadingScreen from '@/components/LoadingScreen';

export default function AdminLoading() {
  return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingScreen message="Accessing Terminal..." />
    </div>
  );
}
