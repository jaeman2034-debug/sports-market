// src/components/SportMarketHighlight.tsx

const SportMarketHighlight = () => {
  // 임시 더미 데이터
  const products = [
    { id: 1, name: "축구공", price: "20,000원" },
    { id: 2, name: "농구공", price: "15,000원" },
    { id: 3, name: "테니스라켓", price: "35,000원" },
  ];

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2>🔥 스포츠마켓 인기상품</h2>
      <ul style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0 }}>
        {products.map((item) => (
          <li key={item.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: "1rem", minWidth: 120 }}>
            <div style={{ fontWeight: "bold" }}>{item.name}</div>
            <div>{item.price}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SportMarketHighlight; 