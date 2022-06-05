import { useState } from "react";

import styles from "./ConfirmScreen.module.css";

import LargeButton from "../UI/LargeButton";
import Card from "../UI/Card";

function ConfirmScreen(props) {
  const [name, setName] = useState(localStorage.getItem("name") || null);
  const [pressed, setPressed] = useState(false);

  const handleNameChange = (event) => {
    const newName = event.target.value;
    setName(newName);
    localStorage.setItem("name", newName);
  };

  const isNameValid = (name) => {
    const cyrillicPattern = /^[\u0400-\u04FF ]{2,}/;
    return cyrillicPattern.test(name);
  };

  const handleClick = () => {
    if (name == null) {
      alert("Введите имя");
      return;
    }
    if (!isNameValid(name)) {
      alert("Имя может содержать только кириллицу");
      return;
    }

    if (!pressed) {
      setPressed(true);

      const searchParams = new URLSearchParams(window.location.search);
      const id = searchParams.get("id");

      if (id === null || id === undefined) {
        setPressed(false);
        alert("Ошибка авторизации. Попробуйте снова перейти по кнопке в чате");
        return;
      }

      let dataCheckString = Array.from(searchParams.entries())
        .filter(i => i[0] !== 'hash')
        .map(i => i.join('='))
        .sort()
        .join('\n');

      fetch(`${process.env.REACT_APP_API_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: + id,
          name: name,
          items: props.items,
          dataCheckString: dataCheckString,
          hash: searchParams.get("hash"),
        }),
      }).then((response) => {
        if (response.status === 200) {
          props.switchToDone();
        } else {
          response.json().then((data) => {
            alert(`Ошибка отправки заказа\n${data.error}`);
          }).catch((error) => {
            alert(`Ошибка отправки заказа\n${error}`);
          });
        }
        setPressed(false);
      });
    }
  };

  return (
    <div>
      <h1 className={styles.h2}>Ваш заказ:</h1>
      <Card>
        <input
          id="nameInput"
          value={name}
          onChange={handleNameChange}
          className={styles.input}
          placeholder="Введите ваше имя"
        />
        <ul>
          {props.items.map((item) => (
            <li key={item.id}>
              {item.name} x{item.quantity}
            </li>
          ))}
        </ul>
      </Card>

      <LargeButton onClick={handleClick}>Отправить</LargeButton>
    </div>
  );
}

export default ConfirmScreen;
