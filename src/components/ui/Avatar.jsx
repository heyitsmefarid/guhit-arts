import { initials } from '../../utils/format';

export default function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (user?.avatar) {
    return <img className="avatar" src={user.avatar} alt="" style={style} />;
  }
  return (
    <span className="avatar avatar--initials" style={style} aria-hidden="true">
      {initials(user?.fullName)}
    </span>
  );
}
