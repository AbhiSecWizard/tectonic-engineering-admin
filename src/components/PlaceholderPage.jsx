const PlaceholderPage = ({ title }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-heading">{title}</h1>
      <p className="mt-2 text-sm text-muted">This page is under construction.</p>
    </div>
  );
};
  
export default PlaceholderPage;