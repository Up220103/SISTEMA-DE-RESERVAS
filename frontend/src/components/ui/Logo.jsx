// Logo oficial UPA. El archivo vive en frontend/public/upa-logo.png
// (Vite sirve la carpeta public/ en la raíz del sitio).
export default function Logo({ className = 'h-10' }) {
  return (
    <img
      src="/upa-logo.png"
      alt="UPA · Universidad Politécnica"
      className={`${className} w-auto object-contain`}
    />
  )
}
