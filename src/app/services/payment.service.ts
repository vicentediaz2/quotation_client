"use server";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { quotationSchema } from "@/components/quotation/table/data/schema";
import { postDataFromApi } from "@/lib/api";
import MercadoPagoConfig, { Preference } from "mercadopago";
import { Items } from "mercadopago/dist/clients/commonTypes";
import { getServerSession } from "next-auth";

import { z } from "zod";

type Quotation = z.infer<typeof quotationSchema>;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function payMercadoPago(quotation: Quotation) {
  const session = await getServerSession(options);
  const items: Items[] = quotation.products.map((product) => {
    return {
      id: product.id.toFixed(),
      title: product.title,
      quantity: product.quantity,
      unit_price: product.value,
      picture_url: product.picture_url,
    };
  });

  const preference = new Preference(client).create({
    body: {
      items,
      metadata: {
        cotizacion: {
          id: quotation.id,
        },
        userToken: session?.user.accessToken,
      },
    },
  });

  const res = await preference;
  return res.id;
}

interface OrderProps {
  payment_id: number | undefined;
  amount: number | undefined;
  status: string | undefined;
  cotizacion: {
    id: number;
  };
  userToken: string;
}

export async function createOrder(order: OrderProps) {
  const res = await postDataFromApi(
    "/api/payments",
    {
      data: order,
    },
    order.userToken
  );
  return res;
}
