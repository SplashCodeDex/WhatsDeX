import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    // In a real application, you would validate these credentials against a database
    // For this example, we'll use hardcoded values
    if (email === 'admin@example.com' && password === 'password') {
      // Generate a JWT token
      const token = jwt.sign(
        { userId: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'your-jwt-secret-key',
        { expiresIn: '1h' },
      );

      res.status(200).json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
