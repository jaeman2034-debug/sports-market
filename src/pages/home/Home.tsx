// src/pages/home/Home.tsx
import ProductForm from "../../components/ProductForm";
import ProductList from "../../components/ProductList";
const Home = () => {
  return (
    <div>
      <header style={{ background: "#4f8cff", color: "#fff", padding: "2rem 1rem" }}>
        <h1>친동래 스포츠마켓</h1>
        <p>체육인을 위한 지역 기반 중고거래 및 체육 일자리 플랫폼</p>
      </header>
      <main style={{ padding: "2rem 1rem" }}>
        <section>
          <ProductForm />
          <ProductList />
        </section>
        <section>
          <h2>🏃 근처 운동 모임</h2>
          <div>여기에 모임 리스트(임시)</div>
        </section>
        <section>
          <h2>💼 일자리 공고 요약</h2>
          <div>여기에 일자리 요약(임시)</div>
        </section>
      </main>
    </div>
  );
};

export default Home;
