import React, { useState, useEffect } from "react";
import { storage } from "../lib/firebaseConfig";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";

interface StorageItem {
  name: string;
  fullPath: string;
  url?: string;
  size?: number;
}

function StorageViewer() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");

  const fetchStorageItems = async (folderPath: string = "") => {
    setLoading(true);
    setError("");
    
    try {
      console.log("Storage 폴더 확인:", folderPath || "루트");
      const folderRef = ref(storage, folderPath);
      const result = await listAll(folderRef);
      
      const itemsWithUrls: StorageItem[] = [];
      
      // 파일들 처리
      for (const item of result.items) {
        try {
          const url = await getDownloadURL(item);
          itemsWithUrls.push({
            name: item.name,
            fullPath: item.fullPath,
            url: url,
            size: 0 // Firebase Storage API에서 파일 크기를 직접 가져오기는 어려움
          });
        } catch (urlError) {
          console.error("URL 가져오기 실패:", item.fullPath, urlError);
          itemsWithUrls.push({
            name: item.name,
            fullPath: item.fullPath
          });
        }
      }
      
      // 폴더들 처리
      for (const folder of result.prefixes) {
        itemsWithUrls.push({
          name: folder.name + "/",
          fullPath: folder.fullPath,
          size: 0
        });
      }
      
      setItems(itemsWithUrls);
      console.log("Storage 항목들:", itemsWithUrls);
      
    } catch (err: any) {
      console.error("Storage 목록 가져오기 오류:", err);
      setError(err.message || "Storage 내용을 가져올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageItems(selectedFolder);
  }, [selectedFolder]);

  const handleFolderClick = (item: StorageItem) => {
    if (item.name.endsWith('/')) {
      setSelectedFolder(item.fullPath);
    }
  };

  const handleDelete = async (item: StorageItem) => {
    if (!item.url) return; // 폴더는 삭제 불가
    
    if (window.confirm(`"${item.name}" 파일을 삭제하시겠습니까?`)) {
      try {
        const fileRef = ref(storage, item.fullPath);
        await deleteObject(fileRef);
        console.log("파일 삭제 완료:", item.fullPath);
        fetchStorageItems(selectedFolder); // 목록 새로고침
      } catch (err: any) {
        console.error("파일 삭제 오류:", err);
        setError("파일 삭제 중 오류가 발생했습니다: " + err.message);
      }
    }
  };

  const handleBack = () => {
    const parentPath = selectedFolder.split('/').slice(0, -1).join('/');
    setSelectedFolder(parentPath);
  };

  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: "32px auto", 
      padding: "24px",
      backgroundColor: "#1a1a1a",
      borderRadius: "12px",
      color: "#ffffff"
    }}>
      <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
        Firebase Storage 내용 확인
      </h3>
      
      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "#cccccc", fontSize: "14px" }}>
          <strong>버킷:</strong> gs://new-sport-market.appspot.com
        </p>
        <p style={{ color: "#cccccc", fontSize: "14px" }}>
          <strong>현재 경로:</strong> {selectedFolder || "루트"}
        </p>
      </div>

      {selectedFolder && (
        <button
          onClick={handleBack}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "16px"
          }}
        >
          ← 상위 폴더로
        </button>
      )}

      {loading && (
        <div style={{ textAlign: "center", color: "#cccccc" }}>
          Storage 내용을 불러오는 중...
        </div>
      )}

      {error && (
        <div style={{ 
          padding: "12px 16px",
          backgroundColor: "#dc3545",
          color: "#ffffff",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: "center", color: "#cccccc" }}>
          이 폴더에 파일이 없습니다.
        </div>
      )}

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
        gap: "16px" 
      }}>
        {items.map((item, index) => (
          <div key={index} style={{
            backgroundColor: "#2a2a2a",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #333",
            cursor: item.name.endsWith('/') ? "pointer" : "default"
          }}>
            {item.name.endsWith('/') ? (
              // 폴더
              <div onClick={() => handleFolderClick(item)}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#007bff" }}>
                  📁 {item.name}
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  폴더
                </div>
              </div>
            ) : (
              // 파일
              <div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>
                  📄 {item.name}
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  파일
                </div>
                
                {item.url && (
                  <div style={{ marginTop: "12px" }}>
                    <img 
                      src={item.url} 
                      alt={item.name}
                      style={{ 
                        maxWidth: "100%", 
                        maxHeight: "150px", 
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #333"
                      }} 
                    />
                  </div>
                )}
                
                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={() => handleDelete(item)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#dc3545",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "#333",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#ccc"
      }}>
        <strong>Storage 정보:</strong>
        <br />
        • 총 {items.length}개 항목
        <br />
        • 폴더: {items.filter(item => item.name.endsWith('/')).length}개
        <br />
        • 파일: {items.filter(item => !item.name.endsWith('/')).length}개
      </div>
    </div>
  );
}

export default StorageViewer; 