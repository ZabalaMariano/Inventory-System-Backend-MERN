import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El campo {name} es obligatorio'],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z\s]+$/.test(v);
        },
        message: (props) =>
          `${props.value} no es un nombre válido! Solo puede contener letras y espacios.`,
      },
    },
    email: {
      type: String,
      required: [true, 'El campo {email} es obligatorio'],
      unique: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Email inválido',
      ],
    },
    password: {
      type: String,
      required: [true, 'El campo {password} es obligatorio'],
      minLength: [
        6,
        'El campo {password} puede tener un mínimo de 6 caracteres',
      ],
      // maxLength: [
      //   32,
      //   'El campo {password} puede tener un máximo de 32 caracteres',
      // ],
    },
    photo: {
      type: String,
      required: [true, 'El campo {photo} es obligatorio'],
      default: 'https://images.app.goo.gl/5ZkboV8AM3Jw3sx2A',
      // default: "https://url-a-mis-imagenes.avatar.png"
    },
    phone: {
      type: String,
      defult: '+54',
    },
    bio: {
      type: String,
      maxLength: [
        250,
        'El campo {bio} puede tener un máximo de 250 caracteres',
      ],
    },
  },
  { timestamps: true }
);

// Encrypt password (after validation)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;

  next();
});

export default mongoose.model('User', userSchema);
