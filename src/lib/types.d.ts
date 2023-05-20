interface Item {
  name: string;
  qty: number;
}

interface Menu {
  updateDate: string;
  receiptDate: string;
  items: string[];
}

interface Order {
  name: string;
  orderedItems: {
    name: string;
    qty: number;
  }[];
}
