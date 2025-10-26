import { ProfileCardProps } from "@/types/supabase"

export default function ProfileCard ({firstName, surname, email, avatarUrl} : ProfileCardProps){
  return( 
    <div className="p-4 border rounded shadow">
      <img
        src={avatarUrl || '/default-avatar.jpg'}
        alt="avatar"
        className="w-24 h-24 rounded-full mb-4"
      />
      <h2 className="text-xl font-bold">{firstName} {surname}</h2>
      <p className="text-gray-600">{email}</p>
    </div>
    )
}