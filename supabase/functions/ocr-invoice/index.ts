import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { image, type } = await req.json();

    if (!image) {
      throw new Error("No image provided");
    }

    // Call OpenAI Vision API for OCR and extraction
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      // Fallback to mock response if no API key
      const mockResult = {
        fecha: new Date().toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        numero_factura: Math.floor(Math.random() * 1000000).toString(),
        razon_social: "EMPRESA DEMO S.A.",
        ruc: "123-456-789012",
        dv: "00",
        subtotal: 10.00,
        itbms: 0.70,
        descuento: 0,
        total: 10.70,
        descripcion: "Producto o servicio genérico (demo mode - Configure OPENAI_API_KEY for real OCR)",
        needsReview: true,
      };

      return new Response(
        JSON.stringify(mockResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mediaType = type || "image/jpeg";
    const base64Data = image;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Eres un experto en extraer información de facturas fiscales de Panamá. Tu tarea es analizar la imagen de una factura y extraer los siguientes campos en formato JSON:

- fecha: Fecha de la factura en formato DD/MM/YYYY
- numero_factura: Número de factura
- razon_social: Nombre o razón social del proveedor
- ruc: Registro Único de Contribuyente formato XXX-XXX-XXXXXX
- dv: Dígito Verificador (1-2 dígitos)
- subtotal: Monto antes de impuestos (número decimal)
- itbms: Impuesto de Transferencia de Bienes Muebles y Servicios (número decimal)
- descuento: Descuento aplicado (número decimal, 0 si no hay)
- total: Monto total (número decimal)
- descripcion: Descripción del producto o servicio

IMPORTANTE:
1. Si un campo no se puede leer claramente, marcar needsReview como true
2. Validar que RUC tenga formato correcto (XXX-XXX-XXXXXX)
3. Verificar que subtotal + itbms - descuento = total (aproximadamente)
4. Responder ÚNICAMENTE con JSON válido, sin texto adicional

Ejemplo de respuesta:
{"fecha": "05/05/2026", "numero_factura": "6577786", "razon_social": "ORLYN S.A.", "ruc": "630-483-123250", "dv": "16", "subtotal": 0.89, "itbms": 0.09, "descuento": 0, "total": 0.98, "descripcion": "Bebida con 10% ITBMS", "needsReview": false}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extrae la información de esta factura fiscal de Panamá y devuelve los datos en formato JSON:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Failed to parse extracted data");
    }

    // Validate and normalize data
    const result = {
      fecha: extractedData.fecha || "",
      numero_factura: extractedData.numero_factura || "",
      razon_social: extractedData.razon_social || "",
      ruc: normalizeRUC(extractedData.ruc || ""),
      dv: extractedData.dv || "",
      subtotal: parseFloat(extractedData.subtotal) || 0,
      itbms: parseFloat(extractedData.itbms) || 0,
      descuento: parseFloat(extractedData.descuento) || 0,
      total: parseFloat(extractedData.total) || 0,
      descripcion: extractedData.descripcion || "",
      needsReview: extractedData.needsReview || false
    };

    // Verify totals
    const calculatedTotal = result.subtotal + result.itbms - result.descuento;
    if (Math.abs(calculatedTotal - result.total) > 0.02) {
      result.needsReview = true;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("OCR Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function normalizeRUC(ruc: string): string {
  // Remove any non-digit characters except dashes
  const cleaned = ruc.replace(/[^\d-]/g, '');

  // If already in correct format, return it
  if (/^\d{3}-\d{3}-\d{6}$/.test(cleaned)) {
    return cleaned;
  }

  // If it's just digits, try to format it
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  }

  return cleaned;
}
