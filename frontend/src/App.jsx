import React, { useState, useEffect } from "react";
import { Container } from "@chakra-ui/react";

import { getMenu, isLoggedIn } from "./services/menuService";
import MenuScreen from "./components/Menu/MenuScreen";
import ConfirmScreen from "./components/Confirm/ConfirmScreen";
import DoneScreen from "./components/DoneScreen/DoneScreen";
import ErrorModal from "./components/UI/ErrorModal";

function App() {
  const [screen, setScreen] = useState("menu");
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("Загружаю...");
  const [error, setError] = useState(null);

  async function fetchData() {
    try {
      const menuResponse = await getMenu();
      if (!menuResponse.ok) {
        if (menuResponse.status === 404) {
          setTitle("Меню не доступно");
        } else {
          setTitle(`Что-то пошло не так 😱`);
        }
        return;
      }

      const json = await menuResponse.json();
      setItems(
        json.items.map((item, index) => ({
          id: index,
          name: item,
          quantity: 0,
        }))
      );
      setTitle(json.title);

      isLoggedIn()
        .then((loggedIn) => {
          if (loggedIn) return;
          setTitle("Ошибка авторизации");
          setItems([]);
        })
        .catch(() => {
          setTitle("Сервер недоступен 😭");
          setItems([]);
        });
    } catch (err) {
      setTitle("Сервер недоступен 😭");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const updateQuantity = (id, quantity) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const switchToConfirem = () => {
    const selectedItems = items.filter((item) => item.quantity > 0);
    if (selectedItems.length > 0) {
      setScreen("confirm");
    } else {
      setError({
        title: "Заказ пуст",
        message: "выберите хотя бы один пункт",
      });
    }
  };

  const switchToDone = () => {
    setScreen("done");
  };

  const selectedItems = items.filter((item) => item.quantity > 0);

  return (
    <Container my="20px">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      {screen === "menu" && (
        <MenuScreen
          updateQuantity={updateQuantity}
          handleButtonClick={switchToConfirem}
          items={items}
          title={title}
        />
      )}
      {screen === "confirm" && (
        <ConfirmScreen
          switchToDone={switchToDone}
          items={selectedItems}
          setError={setError}
        />
      )}
      {screen === "done" && <DoneScreen />}
    </Container>
  );
}

export default App;
