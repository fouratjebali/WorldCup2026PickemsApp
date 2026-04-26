export interface Room {
  id: string;
  code: string;
  name: string;
  created_by_player_id: string;
  is_public: boolean;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  player_id: string;
  joined_at: string;
  room?: Room;
}
