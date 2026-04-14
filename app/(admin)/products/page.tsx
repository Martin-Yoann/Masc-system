"use client";

import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  Switch,
  Space,
  Image,
  Popconfirm,
  message,
} from "antd";

import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  visible: boolean;
  cover: string;
  images: string[];
};

type UploadListItem = { thumbUrl?: string; url?: string };

function normFile(e: unknown) {
  if (Array.isArray(e)) {
    return e;
  }
  if (e && typeof e === "object" && "fileList" in e) {
    return (e as { fileList: unknown }).fileList;
  }
  return undefined;
}

function parseCoverAndImages(values: Record<string, unknown>) {
  const coverRaw = values.cover;
  const coverArr = Array.isArray(coverRaw)
    ? (coverRaw as UploadListItem[])
    : [];
  const cover =
    coverArr[0]?.thumbUrl || coverArr[0]?.url || "";

  const imagesRaw = values.images;
  const imagesArr = Array.isArray(imagesRaw)
    ? (imagesRaw as UploadListItem[])
    : [];
  const images = imagesArr
    .map((f) => f.thumbUrl || f.url || "")
    .filter(Boolean);

  return { cover, images };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "iPhone 15",
      sku: "IP15",
      price: 999,
      stock: 20,
      visible: true,
      cover: "",
      images: [],
    },
  ]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form] = Form.useForm();

  const handleSubmit = (values: Record<string, unknown>) => {
    const { cover, images } = parseCoverAndImages(values);

    const newProduct: Omit<Product, "id"> = {
      name: String(values.name ?? ""),
      sku: String(values.sku ?? ""),
      price: Number(values.price ?? 0),
      stock: Number(values.stock ?? 0),
      visible: Boolean(values.visible ?? true),
      cover,
      images,
    };

    if (editing) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...p, ...newProduct } : p,
        ),
      );

      message.success("Product updated");
    } else {
      setProducts([
        ...products,
        {
          id: Date.now(),
          ...newProduct,
        },
      ]);

      message.success("Product created");
    }

    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const deleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
    message.success("Deleted");
  };

  const editProduct = (record: Product) => {
    setEditing(record);

    form.setFieldsValue({
      ...record,
      cover: record.cover
        ? [
            {
              uid: "-1",
              url: record.cover,
            },
          ]
        : [],
      images:
        record.images?.map((img: string, i: number) => ({
          uid: String(i),
          url: img,
        })) || [],
    });

    setOpen(true);
  };

  const toggleVisible = (id: number, visible: boolean) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, visible } : p)),
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
    },
    {
      title: "Cover",
      dataIndex: "cover",
      render: (cover: string, record: Product) =>
        cover ? (
          <Image src={cover} width={50} alt={record.name || "product"} />
        ) : (
          "-"
        ),
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "SKU",
      dataIndex: "sku",
    },
    {
      title: "Price",
      dataIndex: "price",
      render: (v: number) => `$${v}`,
    },
    {
      title: "Stock",
      dataIndex: "stock",
    },
    {
      title: "Visible",
      dataIndex: "visible",
      render: (v: boolean, record: Product) => (
        <Switch
          checked={v}
          onChange={(val) => toggleVisible(record.id, val)}
        />
      ),
    },
    {
      title: "Actions",
      render: (_: unknown, record: Product) => (
        <Space>
          <Button type="link" onClick={() => editProduct(record)}>
            Edit
          </Button>

          <Popconfirm
            title="Confirm delete?"
            onConfirm={() => deleteProduct(record.id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ marginBottom: 20 }}
        onClick={() => {
          setEditing(null);
          form.resetFields();
          setOpen(true);
        }}
      >
        Create product
      </Button>

      <Table columns={columns} dataSource={products} rowKey="id" />

      <Modal
        title={editing ? "Edit product" : "Create product"}
        open={open}
        width={700}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="name" label="Product name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="sku" label="SKU">
            <Input />
          </Form.Item>

          <Form.Item name="price" label="Price">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="stock" label="Stock">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="cover"
            label="Cover"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload listType="picture" maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Upload cover</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="images"
            label="Images"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
            >
              Upload
            </Upload>
          </Form.Item>

          <Form.Item
            name="visible"
            label="Visible"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
