package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {

    @Query("SELECT o FROM Otp o WHERE o.phone = :phone AND o.verified = false ORDER BY o.createdAt DESC")
    Optional<Otp> findTopByPhoneAndIsVerifiedFalseOrderByCreatedAtDesc(String phone);

    @Query("SELECT o FROM Otp o WHERE o.phone = :phone AND o.otpCode = :otpCode ORDER BY o.createdAt DESC")
    Optional<Otp> findTopByPhoneAndOtpCodeOrderByCreatedAtDesc(String phone, String otpCode);

    @Query("SELECT o FROM Otp o WHERE o.phone = :phone AND o.verified = true")
    List<Otp> findByPhoneAndIsVerifiedTrue(String phone);
}
