import { Configuration, OpenAIApi } from 'openai';
import axios from 'axios';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export default async function handler(req, res) {
  const { titulo } = req.query;

  if (!titulo) {
    return res.status(400).json({ error: 'Falta el parámetro "titulo"' });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Escribe un artículo estilo Medium de al menos 800 palabras sobre: "${titulo}". Usa subtítulos, ejemplos y un tono cercano y profesional.`,
        },
      ],
    });

    const contenido = completion.data.choices[0].message.content;

    const userResp = await axios.get('https://api.medium.com/v1/me', {
      headers: {
        Authorization: `Bearer ${process.env.MEDIUM_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const userId = userResp.data.data.id;

    const postResp = await axios.post(
      `https://api.medium.com/v1/users/${userId}/posts`,
      {
        title: titulo,
        contentFormat: 'markdown',
        content: contenido,
        publishStatus: 'public',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MEDIUM_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      message: 'Artículo publicado exitosamente',
      url: postResp.data.data.url,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      error: 'Ocurrió un error al generar o publicar el artículo.',
      details: error.response?.data || error.message,
    });
  }
}
